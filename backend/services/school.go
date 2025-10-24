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

type SchoolService interface {
	GetSchoolList(ctx context.Context, req *schema.GetSchoolListRequest) ([]*schema.School, error)
	GetSchoolByID(ctx context.Context, schoolID int64) (*schema.School, error)
	CreateSchool(ctx context.Context, req *schema.CreateSchoolRequest) (*schema.School, error)
	UpdateSchool(ctx context.Context, req *schema.UpdateSchoolRequest) (*schema.School, error)
	DeleteSchool(ctx context.Context, schoolID int64) error
}

type schoolService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewSchoolService(queries *dbsqlc.Queries, logger logging.Logger) SchoolService {
	return &schoolService{
		queries: queries,
		logger:  logger,
	}
}

func (s *schoolService) GetSchoolList(ctx context.Context, req *schema.GetSchoolListRequest) ([]*schema.School, error) {
	res := make([]*schema.School, 0)
	dbSchools, err := s.queries.ListSchools(context.Background())
	if err != nil {
		return nil, err
	}
	for _, dbSchool := range dbSchools {
		res = append(res, &schema.School{
			ID:           int64(dbSchool.ID),
			Name:         dbSchool.Name,
			DistrictID:   int64(dbSchool.DistrictID),
			SchoolNumber: dbSchool.SchoolNumber,
		})
	}
	return res, nil
}

func (s *schoolService) GetSchoolByID(ctx context.Context, schoolID int64) (*schema.School, error) {
	School, err := s.queries.FindSchoolById(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to get school by ID: %w", err)
	}
	return &schema.School{
		ID:           int64(School.ID),
		Name:         School.Name,
		DistrictID:   int64(School.DistrictID),
		SchoolNumber: School.SchoolNumber,
	}, nil
}
func (s *schoolService) CreateSchool(ctx context.Context, req *schema.CreateSchoolRequest) (*schema.School, error) {
	dbSchool, err := s.queries.CreateSchool(ctx, dbsqlc.CreateSchoolParams{
		Name:         req.Name,
		DistrictID:   int32(req.DistrictID),
		SchoolNumber: req.SchoolNumber,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create school: %w", err)
	}
	return &schema.School{
		ID:           int64(dbSchool.ID),
		Name:         dbSchool.Name,
		DistrictID:   int64(dbSchool.DistrictID),
		SchoolNumber: dbSchool.SchoolNumber,
	}, nil
}
func (s *schoolService) UpdateSchool(ctx context.Context, req *schema.UpdateSchoolRequest) (*schema.School, error) {
	dbSchool, err := s.queries.UpdateSchool(ctx, dbsqlc.UpdateSchoolParams{
		ID:           int32(req.ID),
		Name:         req.Name,
		DistrictID:   int32(req.DistrictID),
		SchoolNumber: req.SchoolNumber,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update school: %w", err)
	}
	return &schema.School{
		ID:           int64(dbSchool.ID),
		Name:         dbSchool.Name,
		DistrictID:   int64(dbSchool.DistrictID),
		SchoolNumber: dbSchool.SchoolNumber,
	}, nil
}
func (s *schoolService) DeleteSchool(ctx context.Context, schoolID int64) error {
	err := s.queries.DeleteSchool(ctx, int32(schoolID))
	if err != nil {
		if strings.Contains(err.Error(), "foreign key constraint") {
			return common.NewConflictError("cannot delete school: foreign key constraint violation")
		}
	}
	return nil
}
