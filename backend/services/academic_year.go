package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type AcademicYearService interface {
	GetAcademicYearList(ctx context.Context, req *schema.GetAcademicYearListRequest) ([]*schema.AcademicYear, error)
	GetAcademicYearByID(ctx context.Context, academicYearID int64) (*schema.AcademicYear, error)
	CreateAcademicYear(ctx context.Context, req *schema.CreateAcademicYearRequest) (*schema.AcademicYear, error)
	DeleteAcademicYear(ctx context.Context, academicYearID int64) error
}
type academicYearService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewAcademicYearService(queries *dbsqlc.Queries, logger logging.Logger) AcademicYearService {
	return &academicYearService{
		queries: queries,
		logger:  logger,
	}
}
func (s *academicYearService) GetAcademicYearList(ctx context.Context, req *schema.GetAcademicYearListRequest) ([]*schema.AcademicYear, error) {
	res := make([]*schema.AcademicYear, 0)
	dbAcademicYears, err := s.queries.ListAcademicYears(context.Background())
	if err != nil {
		return nil, err
	}
	for _, dbAcademicYear := range dbAcademicYears {
		res = append(res, &schema.AcademicYear{
			ID:        int64(dbAcademicYear.ID),
			Year:      int(dbAcademicYear.Year),
			StartDate: dbAcademicYear.StartDate.Format("2006-01-02"),
			EndDate:   dbAcademicYear.EndDate.Format("2006-01-02"),
			Status:    dbAcademicYear.Status.String,
		})
	}
	return res, nil
}

func (s *academicYearService) GetAcademicYearByID(ctx context.Context, academicYearID int64) (*schema.AcademicYear, error) {
	academicYear, err := s.queries.GetAcademicYearByID(ctx, int32(academicYearID))
	if err != nil {
		return nil, fmt.Errorf("failed to get academic year by ID: %w", err)
	}
	return &schema.AcademicYear{
		ID:        int64(academicYear.ID),
		Year:      int(academicYear.Year),
		StartDate: academicYear.StartDate.Format("2006-01-02"),
		EndDate:   academicYear.EndDate.Format("2006-01-02"),
		Status:    academicYear.Status.String,
	}, nil
}
func (s *academicYearService) CreateAcademicYear(ctx context.Context, req *schema.CreateAcademicYearRequest) (*schema.AcademicYear, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, fmt.Errorf("invalid start date format: %w", err)
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("invalid end date format: %w", err)
	}
	status := sql.NullString{
		String: req.Status,
		Valid:  req.Status != "",
	}
	dbAcademicYear, err := s.queries.CreateAcademicYear(ctx, dbsqlc.CreateAcademicYearParams{
		Year:      int32(req.Year),
		StartDate: startDate,
		EndDate:   endDate,
		Status:    status,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create academic year: %w", err)
	}
	if err := recordAudit(ctx, s.queries, "academic_year", int64(dbAcademicYear.ID), "Created", fmt.Sprintf("Academic year %d", dbAcademicYear.Year)); err != nil {
		return nil, err
	}

	return &schema.AcademicYear{
		ID:   int64(dbAcademicYear.ID),
		Year: int(dbAcademicYear.Year),
	}, nil
}
// DeleteAcademicYear removes a year only while nothing refers to it: deleting one with
// marks or reports would erase every school's records for that year.
func (s *academicYearService) DeleteAcademicYear(ctx context.Context, academicYearID int64) error {
	use, err := s.queries.GetAcademicYearUse(ctx, int32(academicYearID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to check academic year %d: %w", academicYearID, err)
	}
	var inUse []string
	for _, c := range []struct {
		n    int32
		noun string
	}{{use.Marks, "mark"}, {use.Reports, "term report"}, {use.ExamResults, "exam result"}, {use.Results, "year-end result"}, {use.Schools, "school in the year"}} {
		if c.n > 0 {
			inUse = append(inUse, countOf(int(c.n), c.noun))
		}
	}
	if len(inUse) > 0 {
		return newUserError(ErrInUse, "%d cannot be deleted: it has %s.", use.Year, strings.Join(inUse, ", "))
	}
	if err := s.queries.DeleteAcademicYear(ctx, int32(academicYearID)); err != nil {
		if strings.Contains(err.Error(), "foreign key constraint") {
			return newUserError(ErrInUse, "%d cannot be deleted while other records refer to it.", use.Year)
		}
		return fmt.Errorf("failed to delete academic year %d: %w", academicYearID, err)
	}
	return recordAudit(ctx, s.queries, "academic_year", academicYearID, "Deleted", fmt.Sprintf("Academic year %d", use.Year))
}
