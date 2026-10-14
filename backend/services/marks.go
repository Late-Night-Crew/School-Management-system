package services

import (
	"context"
	"database/sql"
	"fmt"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// MarksService records and reads per-student, per-subject marks for a school.
type MarksService interface {
	ListMarks(ctx context.Context, schoolID int64, filter schema.MarksFilter) ([]*schema.StudentMark, error)
	// SaveMarks upserts the given marks and deletes those sent with a null mark.
	// recordedBy is the user ID saving the marks (0 if unknown). Only canCorrectPast
	// (MCDE) may change a year the school has finished; that is recorded in the audit log.
	SaveMarks(ctx context.Context, schoolID int64, recordedBy int64, req *schema.SaveMarksRequest, canCorrectPast bool) (*schema.SaveMarksResult, error)
	// YearMarks lists who was at the school in a year (in their form that year, or
	// every form when formLevel is 0) and their marks for the term, for correcting a
	// finished year.
	YearMarks(ctx context.Context, schoolID, yearID int64, term, formLevel int) (*schema.YearMarks, error)
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
		FormLevel:      optionalID(int64(filter.FormLevel)),
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

func (s *marksService) SaveMarks(ctx context.Context, schoolID int64, recordedBy int64, req *schema.SaveMarksRequest, canCorrectPast bool) (*schema.SaveMarksResult, error) {
	// Not an upcoming year, nor a term the school has not reached, nor (for coordinators)
	// a year the school has finished
	past, err := checkMarksTerm(ctx, s.queries, schoolID, req.AcademicYearID, req.Term, canCorrectPast)
	if err != nil {
		return nil, err
	}

	studentIDs := make([]int32, 0, len(req.Marks))
	for _, entry := range req.Marks {
		studentIDs = append(studentIDs, int32(entry.StudentID))
	}

	// Every entry must be a learner of this school in a subject they take: a current
	// learner, or, in a finished year, someone who was at the school that year
	enrolled, err := s.enrolments(ctx, schoolID, req.AcademicYearID, studentIDs, past && canCorrectPast)
	if err != nil {
		return nil, err
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

	// Corrections to a finished year are recorded against the school
	if past {
		err := s.queries.CreateAuditLog(ctx, dbsqlc.CreateAuditLogParams{
			EntityType:  "school",
			EntityID:    sql.NullInt32{Int32: int32(schoolID), Valid: true},
			Action:      "PastMarksCorrected",
			ActorUserID: int32(recordedBy),
			Note:        sql.NullString{String: fmt.Sprintf("%d saved, %d cleared for academic year %d, Term %d", len(upsert.StudentIds), len(clear.StudentIds), req.AcademicYearID, req.Term), Valid: true},
		})
		if err != nil {
			return nil, fmt.Errorf("failed to record the correction: %w", err)
		}
	}

	return &schema.SaveMarksResult{Saved: len(upsert.StudentIds), Cleared: len(clear.StudentIds)}, nil
}

// enrolments returns which (learner, subject) pairs may take a mark at the school.
// pastYear: the learners are those who were at the school in yearID.
func (s *marksService) enrolments(ctx context.Context, schoolID, yearID int64, studentIDs []int32, pastYear bool) (map[enrolment]bool, error) {
	enrolled := map[enrolment]bool{}
	if !pastYear {
		rows, err := s.queries.ListSubjectEnrolmentsForSchool(ctx, dbsqlc.ListSubjectEnrolmentsForSchoolParams{
			SchoolID:   int32(schoolID),
			StudentIds: studentIDs,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to check subject enrolments: %w", err)
		}
		for _, row := range rows {
			enrolled[enrolment{row.StudentID, row.SubjectID}] = true
		}
		return enrolled, nil
	}
	learners, err := s.queries.ListYearLearners(ctx, dbsqlc.ListYearLearnersParams{SchoolID: int32(schoolID), AcademicYearID: int32(yearID)})
	if err != nil {
		return nil, fmt.Errorf("failed to list the year's learners: %w", err)
	}
	wasThere := make(map[int32]bool, len(learners))
	for _, l := range learners {
		wasThere[l.ID] = true
	}
	ids := make([]int32, 0, len(studentIDs))
	for _, id := range studentIDs {
		if wasThere[id] {
			ids = append(ids, id)
		}
	}
	subjects, err := subjectIDsFor(ctx, s.queries, ids)
	if err != nil {
		return nil, err
	}
	for id, subjectIDs := range subjects {
		for _, subjectID := range subjectIDs {
			enrolled[enrolment{id, int32(subjectID)}] = true
		}
	}
	return enrolled, nil
}

func (s *marksService) YearMarks(ctx context.Context, schoolID, yearID int64, term, formLevel int) (*schema.YearMarks, error) {
	learners, err := s.queries.ListYearLearners(ctx, dbsqlc.ListYearLearnersParams{
		SchoolID: int32(schoolID), AcademicYearID: int32(yearID), FormLevel: optionalID(int64(formLevel)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list the year's learners: %w", err)
	}
	ids := make([]int32, 0, len(learners))
	for _, l := range learners {
		ids = append(ids, l.ID)
	}
	subjects, err := subjectIDsFor(ctx, s.queries, ids)
	if err != nil {
		return nil, err
	}
	out := &schema.YearMarks{Learners: make([]schema.Student, 0, len(learners)), Marks: []schema.StudentMark{}}
	for _, l := range learners {
		out.Learners = append(out.Learners, schema.Student{
			ID: int64(l.ID), StudentNumber: l.StudentNumber, FirstName: l.FirstName, MiddleName: l.MiddleName,
			LastName: l.LastName, Gender: l.Gender, Status: l.Status, FormLevel: int(l.YearForm),
			SchoolID: schoolID, SubjectIDs: subjects[l.ID],
		})
	}
	if len(ids) == 0 {
		return out, nil
	}
	rows, err := s.queries.ListYearMarksForSchool(ctx, dbsqlc.ListYearMarksForSchoolParams{
		SchoolID: int32(schoolID), AcademicYearID: int32(yearID), Term: int32(term), StudentIds: ids,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list the year's marks: %w", err)
	}
	for _, row := range rows {
		out.Marks = append(out.Marks, schema.StudentMark{
			ID: int64(row.ID), StudentID: int64(row.StudentID), SubjectID: int64(row.SubjectID),
			AcademicYearID: int64(row.AcademicYearID), Term: int(row.Term), Mark: int(row.Mark),
			SchoolID: int64(row.SchoolID), UpdatedAt: formatNullTime(row.UpdatedAt),
		})
	}
	return out, nil
}
