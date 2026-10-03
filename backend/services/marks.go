package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// MarksService records and reads per-student, per-subject marks for a school.
type MarksService interface {
	ListMarks(ctx context.Context, schoolID int64, filter schema.MarksFilter) ([]*schema.StudentMark, error)
	// SaveMarks upserts the given marks and deletes those sent with a null mark.
	// recordedBy is the user ID saving the marks (0 if unknown).
	SaveMarks(ctx context.Context, schoolID int64, recordedBy int64, req *schema.SaveMarksRequest) (*schema.SaveMarksResult, error)
}

type marksService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewMarksService(queries *dbsqlc.Queries, logger logging.Logger) MarksService {
	return &marksService{
		queries: queries,
		logger:  logger,
	}
}

func (s *marksService) ListMarks(ctx context.Context, schoolID int64, filter schema.MarksFilter) ([]*schema.StudentMark, error) {
	rows, err := s.queries.ListMarksForSchool(ctx, dbsqlc.ListMarksForSchoolParams{
		SchoolID:       int32(schoolID),
		AcademicYearID: optionalID(filter.AcademicYearID),
		Term:           optionalID(int64(filter.Term)),
		StudentID:      optionalID(filter.StudentID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list marks for school %d: %w", schoolID, err)
	}
	marks := make([]*schema.StudentMark, 0, len(rows))
	for _, row := range rows {
		marks = append(marks, &schema.StudentMark{
			ID:             int64(row.ID),
			StudentID:      int64(row.StudentID),
			SubjectID:      int64(row.SubjectID),
			AcademicYearID: int64(row.AcademicYearID),
			Term:           int(row.Term),
			Mark:           int(row.Mark),
			SchoolID:       int64(row.SchoolID),
			UpdatedAt:      formatNullTime(row.UpdatedAt),
		})
	}
	return marks, nil
}

type enrolment struct{ studentID, subjectID int32 }

func (s *marksService) SaveMarks(ctx context.Context, schoolID int64, recordedBy int64, req *schema.SaveMarksRequest) (*schema.SaveMarksResult, error) {
	if _, err := s.queries.GetAcademicYearByID(ctx, int32(req.AcademicYearID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAcademicYearNotFound
		}
		return nil, fmt.Errorf("failed to look up academic year %d: %w", req.AcademicYearID, err)
	}

	studentIDs := make([]int32, 0, len(req.Marks))
	for _, entry := range req.Marks {
		studentIDs = append(studentIDs, int32(entry.StudentID))
	}

	// Every entry must be a current student of this school in a subject they take
	rows, err := s.queries.ListSubjectEnrolmentsForSchool(ctx, dbsqlc.ListSubjectEnrolmentsForSchoolParams{
		SchoolID:   int32(schoolID),
		StudentIds: studentIDs,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check subject enrolments: %w", err)
	}
	enrolled := make(map[enrolment]bool, len(rows))
	for _, row := range rows {
		enrolled[enrolment{row.StudentID, row.SubjectID}] = true
	}

	var upsert, clear dbsqlc.UpsertMarksParams
	for _, entry := range req.Marks {
		key := enrolment{int32(entry.StudentID), int32(entry.SubjectID)}
		if !enrolled[key] {
			return nil, fmt.Errorf("%w (student %d, subject %d)", ErrMarkNotAllowed, entry.StudentID, entry.SubjectID)
		}
		target := &upsert
		if entry.Mark == nil {
			target = &clear
		} else {
			upsert.Marks = append(upsert.Marks, int32(*entry.Mark))
		}
		target.StudentIds = append(target.StudentIds, key.studentID)
		target.SubjectIds = append(target.SubjectIds, key.subjectID)
	}

	if len(clear.StudentIds) > 0 {
		err := s.queries.DeleteMarks(ctx, dbsqlc.DeleteMarksParams{
			StudentIds:     clear.StudentIds,
			SubjectIds:     clear.SubjectIds,
			AcademicYearID: int32(req.AcademicYearID),
			Term:           int32(req.Term),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to clear marks: %w", err)
		}
	}

	if len(upsert.StudentIds) > 0 {
		upsert.AcademicYearID = int32(req.AcademicYearID)
		upsert.Term = int32(req.Term)
		upsert.SchoolID = int32(schoolID)
		upsert.RecordedBy = sql.NullInt32{Int32: int32(recordedBy), Valid: recordedBy > 0}
		if err := s.queries.UpsertMarks(ctx, upsert); err != nil {
			return nil, fmt.Errorf("failed to save marks: %w", err)
		}
	}

	return &schema.SaveMarksResult{Saved: len(upsert.StudentIds), Cleared: len(clear.StudentIds)}, nil
}
