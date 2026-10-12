package services

import (
	"context"
	"database/sql"
	"errors"
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
	// DeleteSchool only deletes a school that has no records (see GetSchoolUsage);
	// otherwise it returns an ErrInUse error saying what is in the way.
	DeleteSchool(ctx context.Context, schoolID int64) error
	GetSchoolUsage(ctx context.Context, schoolID int64) (*schema.SchoolUsage, error)
	// CloseSchool keeps the school's records, stops new students, transfers and accounts,
	// and deactivates its accounts. actorID is the super admin closing it.
	CloseSchool(ctx context.Context, schoolID, actorID int64, note string) (*schema.CloseSchoolResult, error)
	ReopenSchool(ctx context.Context, schoolID, actorID int64) error
	// TransferAllStudents moves every student of a school (open or closed) to another
	// open school as completed transfers. Students with a pending transfer are skipped.
	TransferAllStudents(ctx context.Context, fromSchoolID, actorID int64, req *schema.TransferAllStudentsRequest) (*schema.TransferAllStudentsResult, error)
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

func toSchool(id int32, name, schoolNumber string, districtID int32, closedAt sql.NullTime) *schema.School {
	school := &schema.School{
		ID:           int64(id),
		Name:         name,
		DistrictID:   int64(districtID),
		SchoolNumber: schoolNumber,
	}
	if closedAt.Valid {
		school.ClosedAt = formatNullTime(closedAt)
	}
	return school
}

func (s *schoolService) GetSchoolList(ctx context.Context, req *schema.GetSchoolListRequest) ([]*schema.School, error) {
	res := make([]*schema.School, 0)
	dbSchools, err := s.queries.ListSchools(context.Background())
	if err != nil {
		return nil, err
	}
	for _, dbSchool := range dbSchools {
		res = append(res, toSchool(dbSchool.ID, dbSchool.Name, dbSchool.SchoolNumber, dbSchool.DistrictID, dbSchool.ClosedAt))
	}
	return res, nil
}

func (s *schoolService) GetSchoolByID(ctx context.Context, schoolID int64) (*schema.School, error) {
	School, err := s.queries.FindSchoolById(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to get school by ID: %w", err)
	}
	return toSchool(School.ID, School.Name, School.SchoolNumber, School.DistrictID, School.ClosedAt), nil
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
	return toSchool(dbSchool.ID, dbSchool.Name, dbSchool.SchoolNumber, dbSchool.DistrictID, dbSchool.ClosedAt), nil
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
	// The school may have changed district; its managers' accounts copy it
	if err := s.queries.SyncSchoolAccountScopes(ctx); err != nil {
		return nil, fmt.Errorf("failed to update school accounts: %w", err)
	}
	return toSchool(dbSchool.ID, dbSchool.Name, dbSchool.SchoolNumber, dbSchool.DistrictID, dbSchool.ClosedAt), nil
}

func (s *schoolService) GetSchoolUsage(ctx context.Context, schoolID int64) (*schema.SchoolUsage, error) {
	closedAt, err := s.queries.GetSchoolClosedAt(ctx, int32(schoolID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to look up school %d: %w", schoolID, err)
	}
	row, err := s.queries.GetSchoolUsage(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to count records for school %d: %w", schoolID, err)
	}
	usage := &schema.SchoolUsage{
		Students:                     int(row.Students),
		Marks:                        int(row.Marks),
		Transfers:                    int(row.Transfers),
		UnfinishedIncomingTransfers:  int(row.UnfinishedIncomingTransfers),
		StudentsWithPendingTransfers: int(row.StudentsWithPendingTransfers),
		ExamResults:                  int(row.ExamResults),
		ActiveAccounts:               int(row.ActiveAccounts),
		Closed:                       closedAt.Valid,
	}
	usage.CanDelete = usage.Students == 0 && usage.Marks == 0 && usage.Transfers == 0 &&
		usage.ExamResults == 0 && usage.ActiveAccounts == 0
	return usage, nil
}

func (s *schoolService) DeleteSchool(ctx context.Context, schoolID int64) error {
	usage, err := s.GetSchoolUsage(ctx, schoolID)
	if err != nil {
		return err
	}
	if !usage.CanDelete {
		var records []string
		for _, count := range []struct {
			n    int
			noun string
		}{
			{usage.Students, "student"},
			{usage.Marks, "mark"},
			{usage.Transfers, "transfer"},
			{usage.ExamResults, "exam result"},
		} {
			if count.n > 0 {
				records = append(records, countOf(count.n, count.noun))
			}
		}
		if len(records) > 0 {
			return newUserError(ErrInUse, "This school has %s on record. Deleting it would erase them, so close the school instead.", joinList(records))
		}
		return newUserError(ErrInUse, "This school has %s. Deactivate %s before deleting the school.", countOf(usage.ActiveAccounts, "active account"), pickVerb(usage.ActiveAccounts, "it", "them"))
	}
	if err := s.queries.DeleteSchool(ctx, int32(schoolID)); err != nil {
		// Records added since the check above
		if strings.Contains(err.Error(), "foreign key constraint") {
			return newUserError(ErrInUse, "This school has records on file and cannot be deleted. Close it instead.")
		}
		return fmt.Errorf("failed to delete school %d: %w", schoolID, err)
	}
	return nil
}

func (s *schoolService) CloseSchool(ctx context.Context, schoolID, actorID int64, note string) (*schema.CloseSchoolResult, error) {
	usage, err := s.GetSchoolUsage(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	if usage.Closed {
		return nil, newUserError(ErrInUse, "This school is already closed.")
	}
	if usage.UnfinishedIncomingTransfers > 0 {
		return nil, newUserError(ErrInUse, "This school has %s into it that %s not finished. Reject or complete them before closing the school.",
			countOf(usage.UnfinishedIncomingTransfers, "transfer"), pickVerb(usage.UnfinishedIncomingTransfers, "is", "are"))
	}
	row, err := s.queries.CloseSchool(ctx, dbsqlc.CloseSchoolParams{
		SchoolID:    int32(schoolID),
		ActorUserID: int32(actorID),
		Note:        common.NullString(strings.TrimSpace(note)),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, newUserError(ErrInUse, "This school is already closed.")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to close school %d: %w", schoolID, err)
	}
	return &schema.CloseSchoolResult{AccountsDeactivated: int(row.AccountsDeactivated)}, nil
}

func (s *schoolService) ReopenSchool(ctx context.Context, schoolID, actorID int64) error {
	_, err := s.queries.ReopenSchool(ctx, dbsqlc.ReopenSchoolParams{
		SchoolID:    int32(schoolID),
		ActorUserID: int32(actorID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return newUserError(ErrInUse, "This school is not closed.")
	}
	if err != nil {
		return fmt.Errorf("failed to reopen school %d: %w", schoolID, err)
	}
	return nil
}

func (s *schoolService) TransferAllStudents(ctx context.Context, fromSchoolID, actorID int64, req *schema.TransferAllStudentsRequest) (*schema.TransferAllStudentsResult, error) {
	if fromSchoolID == req.ToSchoolID {
		return nil, newUserError(ErrInvalidMove, "Choose a different school to transfer the students to.")
	}
	usage, err := s.GetSchoolUsage(ctx, fromSchoolID)
	if err != nil {
		return nil, err
	}
	if usage.Students == 0 {
		return nil, newUserError(ErrInvalidMove, "This school has no students to transfer.")
	}
	if usage.Students == usage.StudentsWithPendingTransfers {
		return nil, newUserError(ErrInUse, "Every student left at this school has a pending transfer. Approve or reject those transfers instead.")
	}
	if err := checkSchoolOpen(ctx, s.queries, req.ToSchoolID); err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, newUserError(ErrInvalidMove, "The receiving school does not exist.")
		}
		if errors.Is(err, ErrSchoolClosed) {
			return nil, newUserError(ErrInvalidMove, "The receiving school is closed. Choose an open school.")
		}
		return nil, err
	}
	row, err := s.queries.TransferAllStudents(ctx, dbsqlc.TransferAllStudentsParams{
		FromSchoolID: int32(fromSchoolID),
		ToSchoolID:   int32(req.ToSchoolID),
		Reason:       strings.TrimSpace(req.Reason),
		ActorUserID:  int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to transfer students from school %d to %d: %w", fromSchoolID, req.ToSchoolID, err)
	}
	return &schema.TransferAllStudentsResult{Transferred: int(row.Transferred), Skipped: int(row.Skipped)}, nil
}

// checkSchoolOpen returns ErrSchoolClosed for a closed school and ErrNotFound for a
// missing one, so closed schools take no new students, transfers or accounts.
func checkSchoolOpen(ctx context.Context, queries *dbsqlc.Queries, schoolID int64) error {
	closedAt, err := queries.GetSchoolClosedAt(ctx, int32(schoolID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up school %d: %w", schoolID, err)
	}
	if closedAt.Valid {
		return ErrSchoolClosed
	}
	return nil
}
