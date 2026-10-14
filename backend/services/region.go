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

type RegionService interface {
	GetRegionList(ctx context.Context, req *schema.GetRegionListRequest) ([]*schema.Region, error)
	GetRegionByID(ctx context.Context, regionID int64) (*schema.Region, error)
	CreateRegion(ctx context.Context, req *schema.CreateRegionRequest) (*schema.Region, error)
	UpdateRegion(ctx context.Context, req *schema.UpdateRegionRequest) (*schema.Region, error)
	// DeleteRegion only deletes a division with no districts; otherwise it returns an
	// ErrInUse error. Move its districts first (MoveDistricts).
	DeleteRegion(ctx context.Context, regionID int64) error
	GetRegionUsage(ctx context.Context, regionID int64) (*schema.RegionUsage, error)
	// MoveDistricts moves every district in a division (with their schools) to another.
	MoveDistricts(ctx context.Context, fromRegionID, toRegionID, actorID int64) (*schema.MoveResult, error)
}

type regionService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewRegionService(queries *dbsqlc.Queries, logger logging.Logger) RegionService {
	return &regionService{
		queries: queries,
		logger:  logger,
	}
}

func (s *regionService) GetRegionList(ctx context.Context, req *schema.GetRegionListRequest) ([]*schema.Region, error) {
	res := make([]*schema.Region, 0)
	dbRegions, err := s.queries.ListRegions(context.Background())
	if err != nil {
		return nil, err
	}
	for _, dbRegion := range dbRegions {
		res = append(res, &schema.Region{
			ID:   int64(dbRegion.ID),
			Name: dbRegion.Name,
		})
	}
	return res, nil
}
func (s *regionService) GetRegionByID(ctx context.Context, regionID int64) (*schema.Region, error) {
	Region, err := s.queries.FindRegionById(ctx, int32(regionID))
	if err != nil {
		return nil, fmt.Errorf("failed to get region by ID: %w", err)
	}
	return &schema.Region{
		ID:   int64(Region.ID),
		Name: Region.Name,
	}, nil
}
func (s *regionService) CreateRegion(ctx context.Context, req *schema.CreateRegionRequest) (*schema.Region, error) {
	dbRegion, err := s.queries.CreateRegion(ctx, req.Name)
	if err != nil {
		return nil, fmt.Errorf("failed to create region: %w", err)
	}
	if err := recordAudit(ctx, s.queries, "region", int64(dbRegion.ID), "Created", dbRegion.Name+" division"); err != nil {
		return nil, err
	}
	return &schema.Region{
		ID:   int64(dbRegion.ID),
		Name: dbRegion.Name,
	}, nil
}

func (s *regionService) UpdateRegion(ctx context.Context, req *schema.UpdateRegionRequest) (*schema.Region, error) {
	region, err := s.queries.UpdateRegion(ctx, dbsqlc.UpdateRegionParams{
		ID:   int32(req.ID),
		Name: req.Name,
	})
	if err != nil {
		return nil, err
	}
	if err := recordAudit(ctx, s.queries, "region", int64(region.ID), "Updated", "Renamed "+region.Name+" division"); err != nil {
		return nil, err
	}
	return &schema.Region{
		ID:   int64(region.ID),
		Name: region.Name,
	}, nil
}

func (s *regionService) GetRegionUsage(ctx context.Context, regionID int64) (*schema.RegionUsage, error) {
	if _, err := s.queries.GetRegionName(ctx, int32(regionID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to look up region %d: %w", regionID, err)
	}
	row, err := s.queries.GetRegionUsage(ctx, int32(regionID))
	if err != nil {
		return nil, fmt.Errorf("failed to count records for region %d: %w", regionID, err)
	}
	usage := &schema.RegionUsage{Districts: int(row.Districts), Schools: int(row.Schools), ActiveAccounts: int(row.ActiveAccounts)}
	usage.CanDelete = usage.Districts == 0 && usage.ActiveAccounts == 0
	return usage, nil
}

func (s *regionService) DeleteRegion(ctx context.Context, regionID int64) error {
	usage, err := s.GetRegionUsage(ctx, regionID)
	if err != nil {
		return err
	}
	name, _ := s.queries.GetRegionName(ctx, int32(regionID))
	if usage.Districts > 0 {
		return newUserError(ErrInUse, "This division has %s. Move them to another division before deleting it.", countOf(usage.Districts, "district"))
	}
	if usage.ActiveAccounts > 0 {
		return newUserError(ErrInUse, "This division has %s. Deactivate %s before deleting the division.", countOf(usage.ActiveAccounts, "active account"), pickVerb(usage.ActiveAccounts, "it", "them"))
	}
	if err := s.queries.DeleteRegion(ctx, int32(regionID)); err != nil {
		// A district added since the check above
		if strings.Contains(err.Error(), "foreign key constraint") {
			return newUserError(ErrInUse, "This division has districts and cannot be deleted. Move them first.")
		}
		return fmt.Errorf("failed to delete region %d: %w", regionID, err)
	}
	return recordAudit(ctx, s.queries, "region", regionID, "Deleted", name+" division")
}

func (s *regionService) MoveDistricts(ctx context.Context, fromRegionID, toRegionID, actorID int64) (*schema.MoveResult, error) {
	if fromRegionID == toRegionID {
		return nil, newUserError(ErrInvalidMove, "Choose a different division to move the districts to.")
	}
	for _, id := range []int64{fromRegionID, toRegionID} {
		if _, err := s.queries.GetRegionName(ctx, int32(id)); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, newUserError(ErrInvalidMove, "Division %d does not exist.", id)
			}
			return nil, fmt.Errorf("failed to look up region %d: %w", id, err)
		}
	}
	// District names are unique within a division
	clashes, err := s.queries.ListDistrictNameClashes(ctx, dbsqlc.ListDistrictNameClashesParams{
		FromRegionID: int32(fromRegionID),
		ToRegionID:   int32(toRegionID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check district names: %w", err)
	}
	if len(clashes) > 0 {
		return nil, newUserError(ErrInUse, "The other division already has a district called %s. Rename one of them first.", strings.Join(clashes, ", "))
	}
	moved, err := s.queries.MoveRegionDistricts(ctx, dbsqlc.MoveRegionDistrictsParams{
		FromRegionID: int32(fromRegionID),
		ToRegionID:   int32(toRegionID),
		ActorUserID:  int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to move districts from region %d to %d: %w", fromRegionID, toRegionID, err)
	}
	return &schema.MoveResult{Moved: int(moved)}, nil
}
