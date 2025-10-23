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

type RegionService interface {
	GetRegionList(ctx context.Context, req *schema.GetRegionListRequest) ([]*schema.Region, error)
	GetRegionByID(ctx context.Context, regionID int64) (*schema.Region, error)
	CreateRegion(ctx context.Context, req *schema.CreateRegionRequest) (*schema.Region, error)
	UpdateRegion(ctx context.Context, req *schema.UpdateRegionRequest) (*schema.Region, error)
	DeleteRegion(ctx context.Context, regionID int64) error
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
    return &schema.Region{
        ID:   int64(region.ID),
        Name: region.Name,
    }, nil
}

func (s *regionService) DeleteRegion(ctx context.Context, regionID int64) error {
	err := s.queries.DeleteRegion(ctx, int32(regionID))
	if err != nil {
		if strings.Contains(err.Error(), "foreign key constraint") {
			return common.NewConflictError("Region is in use and cannot be deleted")
		}
		return fmt.Errorf("failed to delete region: %w", err)
	}
	return nil
}
