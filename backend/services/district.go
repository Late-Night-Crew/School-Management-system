package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type DistrictService interface {
	GetDistrictList(ctx context.Context, req *schema.GetDistrictListRequest) ([]*schema.District, error)
	GetDistrictByID(ctx context.Context, districtID int64) (*schema.District, error)
	CreateDistrict(ctx context.Context, req *schema.CreateDistrictRequest) (*schema.District, error)
	UpdateDistrict(ctx context.Context, req *schema.UpdateDistrictRequest) (*schema.District, error)
	// DeleteDistrict only deletes a district with no schools; otherwise it returns an
	// ErrInUse error. Move its schools first (MoveSchools).
	DeleteDistrict(ctx context.Context, districtID int64) error
	GetDistrictUsage(ctx context.Context, districtID int64) (*schema.DistrictUsage, error)
	// MoveSchools moves every school in a district to another district.
	MoveSchools(ctx context.Context, fromDistrictID, toDistrictID, actorID int64) (*schema.MoveResult, error)
}

type districtService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewDistrictService(queries *dbsqlc.Queries, logger logging.Logger) DistrictService {
	return &districtService{
		queries: queries,
		logger:  logger,
	}
}	

func (s *districtService) GetDistrictList(ctx context.Context, req *schema.GetDistrictListRequest) ([]*schema.District, error) {
	res := make([]*schema.District, 0)
	dbDistricts, err := s.queries.ListDistricts(context.Background())
	if err != nil {
		return nil, err
	}
	for _, dbDistrict := range dbDistricts {
		res = append(res, &schema.District{
			ID:       int64(dbDistrict.ID),
			Name:     dbDistrict.Name,
			RegionID: int64(dbDistrict.RegionID),
		})
	}
	return res, nil
}

func (s *districtService) GetDistrictByID(ctx context.Context, districtID int64) (*schema.District, error) {
	District, err := s.queries.FindDistrictById(ctx, int32(districtID))
	if err != nil {
		return nil, fmt.Errorf("failed to get district by ID: %w", err)
	}
	return &schema.District{
		ID:       int64(District.ID),
		Name:     District.Name,
		RegionID: int64(District.RegionID),
	}, nil
}
func (s *districtService) CreateDistrict(ctx context.Context, req *schema.CreateDistrictRequest) (*schema.District, error) {
	dbDistrict, err := s.queries.CreateDistrict(ctx, dbsqlc.CreateDistrictParams{
		Name:     req.Name,
		RegionID: int32(req.RegionID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create district: %w", err)
	}
	return &schema.District{
		ID:       int64(dbDistrict.ID),
		Name:     dbDistrict.Name,
		RegionID: int64(dbDistrict.RegionID),
	}, nil
}
func (s *districtService) UpdateDistrict(ctx context.Context, req *schema.UpdateDistrictRequest) (*schema.District, error) {
	district, err := s.queries.UpdateDistrict(ctx, dbsqlc.UpdateDistrictParams{
		ID:       int32(req.ID),
		Name:     req.Name,
		RegionID: int32(req.RegionID),
	})
	if err != nil {
		return nil, err
	}
	// The district may have changed division; school managers' accounts copy it
	if err := s.queries.SyncSchoolAccountScopes(ctx); err != nil {
		return nil, fmt.Errorf("failed to update school accounts: %w", err)
	}
	return &schema.District{
		ID:       int64(district.ID),
		Name:     district.Name,
		RegionID: int64(district.RegionID),
	}, nil
}
func (s *districtService) GetDistrictUsage(ctx context.Context, districtID int64) (*schema.DistrictUsage, error) {
	if _, err := s.queries.FindDistrictById(ctx, int32(districtID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to look up district %d: %w", districtID, err)
	}
	row, err := s.queries.GetDistrictUsage(ctx, int32(districtID))
	if err != nil {
		return nil, fmt.Errorf("failed to count records for district %d: %w", districtID, err)
	}
	usage := &schema.DistrictUsage{Schools: int(row.Schools), ActiveAccounts: int(row.ActiveAccounts)}
	usage.CanDelete = usage.Schools == 0 && usage.ActiveAccounts == 0
	return usage, nil
}

func (s *districtService) DeleteDistrict(ctx context.Context, districtID int64) error {
	usage, err := s.GetDistrictUsage(ctx, districtID)
	if err != nil {
		return err
	}
	if usage.Schools > 0 {
		return newUserError(ErrInUse, "This district has %s. Move them to another district before deleting it.", countOf(usage.Schools, "school"))
	}
	if usage.ActiveAccounts > 0 {
		return newUserError(ErrInUse, "This district has %s. Deactivate %s before deleting the district.", countOf(usage.ActiveAccounts, "active account"), pickVerb(usage.ActiveAccounts, "it", "them"))
	}
	if err := s.queries.DeleteDistrict(ctx, int32(districtID)); err != nil {
		// A school added since the check above
		if strings.Contains(err.Error(), "foreign key constraint") {
			return newUserError(ErrInUse, "This district has schools and cannot be deleted. Move them first.")
		}
		return fmt.Errorf("failed to delete district %d: %w", districtID, err)
	}
	return nil
}

func (s *districtService) MoveSchools(ctx context.Context, fromDistrictID, toDistrictID, actorID int64) (*schema.MoveResult, error) {
	if fromDistrictID == toDistrictID {
		return nil, newUserError(ErrInvalidMove, "Choose a different district to move the schools to.")
	}
	for _, id := range []int64{fromDistrictID, toDistrictID} {
		if _, err := s.queries.FindDistrictById(ctx, int32(id)); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, newUserError(ErrInvalidMove, "District %d does not exist.", id)
			}
			return nil, fmt.Errorf("failed to look up district %d: %w", id, err)
		}
	}
	// School names are unique within a district
	clashes, err := s.queries.ListSchoolNameClashes(ctx, dbsqlc.ListSchoolNameClashesParams{
		FromDistrictID: int32(fromDistrictID),
		ToDistrictID:   int32(toDistrictID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check school names: %w", err)
	}
	if len(clashes) > 0 {
		return nil, newUserError(ErrInUse, "The other district already has a school called %s. Rename one of them first.", strings.Join(clashes, ", "))
	}
	moved, err := s.queries.MoveDistrictSchools(ctx, dbsqlc.MoveDistrictSchoolsParams{
		FromDistrictID: int32(fromDistrictID),
		ToDistrictID:   int32(toDistrictID),
		ActorUserID:    int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to move schools from district %d to %d: %w", fromDistrictID, toDistrictID, err)
	}
	return &schema.MoveResult{Moved: int(moved)}, nil
}
