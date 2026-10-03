package services

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type ReportService interface {
	GetSchoolReport(ctx context.Context, filter schema.SchoolReportFilter) ([]*schema.SchoolReportRow, error)
}

type reportService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewReportService(queries *dbsqlc.Queries, logger logging.Logger) ReportService {
	return &reportService{
		queries: queries,
		logger:  logger,
	}
}

func optionalID(id int64) sql.NullInt32 {
	return sql.NullInt32{Int32: int32(id), Valid: id > 0}
}

// parseRate converts a NUMERIC pass rate to a float, or nil when it is not recorded.
func parseRate(value sql.NullString) (*float64, error) {
	if !value.Valid || value.String == "" {
		return nil, nil
	}
	rate, err := strconv.ParseFloat(value.String, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid pass rate %q: %w", value.String, err)
	}
	return &rate, nil
}

func (s *reportService) GetSchoolReport(ctx context.Context, filter schema.SchoolReportFilter) ([]*schema.SchoolReportRow, error) {
	rows, err := s.queries.GetSchoolReport(ctx, dbsqlc.GetSchoolReportParams{
		RegionID:       optionalID(filter.RegionID),
		DistrictID:     optionalID(filter.DistrictID),
		AcademicYearID: optionalID(filter.AcademicYearID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get school report: %w", err)
	}

	report := make([]*schema.SchoolReportRow, 0, len(rows))
	for _, row := range rows {
		jce, err := parseRate(row.JcePassRate)
		if err != nil {
			return nil, err
		}
		msce, err := parseRate(row.MscePassRate)
		if err != nil {
			return nil, err
		}
		report = append(report, &schema.SchoolReportRow{
			SchoolID:        int64(row.ID),
			SchoolName:      row.Name,
			SchoolNumber:    row.SchoolNumber,
			DistrictID:      int64(row.DistrictID),
			DistrictName:    row.DistrictName,
			RegionID:        int64(row.RegionID),
			RegionName:      row.RegionName,
			StudentCount:    row.StudentCount,
			MaleCount:       row.MaleCount,
			FemaleCount:     row.FemaleCount,
			DisabilityCount: row.DisabilityCount,
			TransfersIn:     row.TransfersIn,
			TransfersOut:    row.TransfersOut,
			PendingIn:       row.PendingIn,
			JcePassRate:     jce,
			MscePassRate:    msce,
		})
	}
	return report, nil
}
