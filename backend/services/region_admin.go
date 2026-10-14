package services

import (
	"context"
	"fmt"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// RegionAdminService provides read-only views of one region for regional admins.
// The school report for a region comes from ReportService with the region filter set.
type RegionAdminService interface {
	GetDashboardStats(ctx context.Context, regionID int64) (*schema.RegionDashboardStats, error)
	ListDistricts(ctx context.Context, regionID int64) ([]*schema.RegionDistrictSummary, error)
	ListTransfers(ctx context.Context, regionID int64) ([]*schema.Transfer, error)
}

type regionAdminService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewRegionAdminService(queries *dbsqlc.Queries, logger logging.Logger) RegionAdminService {
	return &regionAdminService{
		queries: queries,
		logger:  logger,
	}
}

func (s *regionAdminService) GetDashboardStats(ctx context.Context, regionID int64) (*schema.RegionDashboardStats, error) {
	stats, err := s.queries.GetRegionDashboardStats(ctx, int32(regionID))
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard stats for region %d: %w", regionID, err)
	}
	return &schema.RegionDashboardStats{
		DistrictCount:        stats.DistrictCount,
		SchoolCount:          stats.SchoolCount,
		StudentCount:         stats.StudentCount,
		MaleCount:            stats.MaleCount,
		FemaleCount:          stats.FemaleCount,
		DisabilityCount:      stats.DisabilityCount,
		PendingTransferCount: stats.PendingTransferCount,
	}, nil
}

func (s *regionAdminService) ListDistricts(ctx context.Context, regionID int64) ([]*schema.RegionDistrictSummary, error) {
	rows, err := s.queries.GetRegionDistrictSummary(ctx, int32(regionID))
	if err != nil {
		return nil, fmt.Errorf("failed to list districts for region %d: %w", regionID, err)
	}
	districts := make([]*schema.RegionDistrictSummary, 0, len(rows))
	for _, row := range rows {
		districts = append(districts, &schema.RegionDistrictSummary{
			ID:           int64(row.ID),
			Name:         row.Name,
			SchoolCount:  row.SchoolCount,
			StudentCount: row.StudentCount,
		})
	}
	return districts, nil
}

func (s *regionAdminService) ListTransfers(ctx context.Context, regionID int64) ([]*schema.Transfer, error) {
	rows, err := s.queries.ListTransfersForRegion(ctx, int32(regionID))
	if err != nil {
		return nil, fmt.Errorf("failed to list transfers for region %d: %w", regionID, err)
	}
	transfers := make([]*schema.Transfer, 0, len(rows))
	for _, row := range rows {
		transfers = append(transfers, toTransfer(dbsqlc.GetTransferByIDRow(row)))
	}
	return transfers, nil
}
