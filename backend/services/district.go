package services

import (
	"context"
	// "database/sql"
	// "errors"
	"fmt"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type DistrictService interface {
	GetDistrictList(ctx context.Context, req *schema.GetDistrictListRequest) ([]*schema.District, error)
	GetDistrictByID(ctx context.Context, districtID int64) (*schema.District, error)
	CreateDistrict(ctx context.Context, req *schema.CreateDistrictRequest) (*schema.District, error)
	UpdateDistrict(ctx context.Context, req *schema.UpdateDistrictRequest) (*schema.District, error)
	DeleteDistrict(ctx context.Context, districtID int64) error
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
	return &schema.District{
		ID:       int64(district.ID),
		Name:     district.Name,
		RegionID: int64(district.RegionID),
	}, nil
}
func (s *districtService) DeleteDistrict(ctx context.Context, districtID int64) error {
	err := s.queries.DeleteDistrict(ctx, int32(districtID))
	if err != nil {
		if strings.Contains(err.Error(), "foreign key constraint") {
			return common.NewConflictError("cannot delete district: foreign key constraint violation")
		}
	}
	return fmt.Errorf("failed to delete region: %w", err)
}
