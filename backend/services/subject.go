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

type SubjectService interface {
	ListSubjects(ctx context.Context) ([]*schema.Subject, error)
	GetSubjectByID(ctx context.Context, subjectID int32) (*schema.Subject, error)
	CreateSubject(ctx context.Context, req *schema.CreateSubjectRequest) (*schema.Subject, error)
	UpdateSubject(ctx context.Context, req *schema.UpdateSubjectRequest) (*schema.Subject, error)
	DeleteSubject(ctx context.Context, subjectID int32) error
}

type subjectService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewSubjectService(queries *dbsqlc.Queries, logger logging.Logger) SubjectService {
	return &subjectService{
		queries: queries,
		logger:  logger,
	}
}

func (s *subjectService) ListSubjects(ctx context.Context) ([]*schema.Subject, error) {
	dbSubjects, err := s.queries.ListSubjects(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list subjects: %w", err)
	}

	subjects := make([]*schema.Subject, 0, len(dbSubjects))
	for _, dbSubject := range dbSubjects {
		var description *string
		if dbSubject.Description.Valid {
			description = &dbSubject.Description.String
		}

		subjects = append(subjects, &schema.Subject{
			ID:          dbSubject.ID,
			Code:        dbSubject.Code,
			Name:        dbSubject.Name,
			Description: description,
			CreatedAt:   dbSubject.CreatedAt.Time,
			UpdatedAt:   dbSubject.UpdatedAt.Time,
		})
	}

	return subjects, nil
}

func (s *subjectService) GetSubjectByID(ctx context.Context, subjectID int32) (*schema.Subject, error) {
	dbSubject, err := s.queries.GetSubjectByID(ctx, subjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subject by ID: %w", err)
	}

	var description *string
	if dbSubject.Description.Valid {
		description = &dbSubject.Description.String
	}

	return &schema.Subject{
		ID:          dbSubject.ID,
		Code:        dbSubject.Code,
		Name:        dbSubject.Name,
		Description: description,
		CreatedAt:   dbSubject.CreatedAt.Time,
		UpdatedAt:   dbSubject.UpdatedAt.Time,
	}, nil
}

func (s *subjectService) CreateSubject(ctx context.Context, req *schema.CreateSubjectRequest) (*schema.Subject, error) {
	var description sql.NullString
	if req.Description != nil {
		description = sql.NullString{String: *req.Description, Valid: true}
	}

	dbSubject, err := s.queries.CreateSubject(ctx, dbsqlc.CreateSubjectParams{
		Code:        req.Code,
		Name:        req.Name,
		Description: description,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create subject: %w", err)
	}
	if err := recordAudit(ctx, s.queries, "subject", int64(dbSubject.ID), "Created", fmt.Sprintf("%s (%s)", dbSubject.Name, dbSubject.Code)); err != nil {
		return nil, err
	}

	var descriptionPtr *string
	if dbSubject.Description.Valid {
		descriptionPtr = &dbSubject.Description.String
	}

	return &schema.Subject{
		ID:          dbSubject.ID,
		Code:        dbSubject.Code,
		Name:        dbSubject.Name,
		Description: descriptionPtr,
		CreatedAt:   dbSubject.CreatedAt.Time,
		UpdatedAt:   dbSubject.UpdatedAt.Time,
	}, nil
}

func (s *subjectService) UpdateSubject(ctx context.Context, req *schema.UpdateSubjectRequest) (*schema.Subject, error) {
	var description sql.NullString
	if req.Description != nil {
		description = sql.NullString{String: *req.Description, Valid: true}
	}

	dbSubject, err := s.queries.UpdateSubject(ctx, dbsqlc.UpdateSubjectParams{
		ID:          req.ID,
		Code:        req.Code,
		Name:        req.Name,
		Description: description,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update subject: %w", err)
	}
	if err := recordAudit(ctx, s.queries, "subject", int64(dbSubject.ID), "Updated", fmt.Sprintf("%s (%s)", dbSubject.Name, dbSubject.Code)); err != nil {
		return nil, err
	}

	var descriptionPtr *string
	if dbSubject.Description.Valid {
		descriptionPtr = &dbSubject.Description.String
	}

	return &schema.Subject{
		ID:          dbSubject.ID,
		Code:        dbSubject.Code,
		Name:        dbSubject.Name,
		Description: descriptionPtr,
		CreatedAt:   dbSubject.CreatedAt.Time,
		UpdatedAt:   dbSubject.UpdatedAt.Time,
	}, nil
}

// DeleteSubject removes a subject only while no learner takes it and no marks use it:
// deleting one with marks would erase them in every school.
func (s *subjectService) DeleteSubject(ctx context.Context, subjectID int32) error {
	use, err := s.queries.GetSubjectUse(ctx, subjectID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to check subject %d: %w", subjectID, err)
	}
	if use.Marks > 0 || use.Learners > 0 {
		return newUserError(ErrInUse, "%s cannot be deleted: %s take it and it has %s.", use.Name,
			countOf(int(use.Learners), "learner"), countOf(int(use.Marks), "mark"))
	}
	if err := s.queries.DeleteSubject(ctx, subjectID); err != nil {
		if strings.Contains(err.Error(), "foreign key constraint") {
			return newUserError(ErrInUse, "%s cannot be deleted while other records refer to it.", use.Name)
		}
		return fmt.Errorf("failed to delete subject: %w", err)
	}
	return recordAudit(ctx, s.queries, "subject", int64(subjectID), "Deleted", "Subject "+use.Name)
}
