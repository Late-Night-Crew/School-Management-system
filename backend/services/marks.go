package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

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
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewMarksService(db *sql.DB, queries *dbsqlc.Queries, logger logging.Logger) MarksService {
	return &marksService{db: db, queries: queries, logger: logger}
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
	// a term the school has closed
	target, err := checkMarksTerm(ctx, s.queries, schoolID, req.AcademicYearID, req.Term, canCorrectPast)
	if err != nil {
		return nil, err
	}

	studentIDs := make([]int32, 0, len(req.Marks))
	subjectIDs := make([]int32, 0, len(req.Marks))
	seen := make(map[enrolment]bool, len(req.Marks))
	for _, entry := range req.Marks {
		key := enrolment{int32(entry.StudentID), int32(entry.SubjectID)}
		if seen[key] {
			return nil, fmt.Errorf("%w (student %d, subject %d is listed twice)", ErrMarkNotAllowed, entry.StudentID, entry.SubjectID)
		}
		seen[key] = true
		studentIDs = append(studentIDs, key.studentID)
		subjectIDs = append(subjectIDs, key.subjectID)
	}

	// Every entry must be a learner of this school in a subject they take: a current
	// learner, or, in a finished year, someone who was at the school that year
	enrolled, err := s.enrolments(ctx, schoolID, req.AcademicYearID, studentIDs, target.pastYear && canCorrectPast)
	if err != nil {
		return nil, err
	}
	// What is there now: a mark another school recorded (before a learner moved) is
	// that school's, and closed-term corrections are audited mark by mark
	pairs, err := s.queries.ListMarkPairs(ctx, dbsqlc.ListMarkPairsParams{
		StudentIds: studentIDs, SubjectIds: subjectIDs, AcademicYearID: int32(req.AcademicYearID), Term: int32(req.Term),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to read current marks: %w", err)
	}
	existing := make(map[enrolment]dbsqlc.ListMarkPairsRow, len(pairs))
	for _, p := range pairs {
		existing[enrolment{p.StudentID, p.SubjectID}] = p
	}

	var upsert, clear dbsqlc.UpsertMarksParams
	var changes []string
	for _, entry := range req.Marks {
		key := enrolment{int32(entry.StudentID), int32(entry.SubjectID)}
		if !enrolled[key] {
			return nil, fmt.Errorf("%w (student %d, subject %d)", ErrMarkNotAllowed, entry.StudentID, entry.SubjectID)
		}
		now := existing[key]
		if now.SchoolID.Valid && int64(now.SchoolID.Int32) != schoolID {
			return nil, fmt.Errorf("%w (%s's %s mark for this term was recorded by their previous school)", ErrMarkNotAllowed, now.Learner, now.Subject)
		}
		list := &upsert
		if entry.Mark == nil {
			list = &clear
		} else {
			upsert.Marks = append(upsert.Marks, int32(*entry.Mark))
		}
		list.StudentIds = append(list.StudentIds, key.studentID)
		list.SubjectIds = append(list.SubjectIds, key.subjectID)
		if target.closed {
			changes = append(changes, describeMarkChange(now, entry.Mark))
		}
	}

	// Cleared and saved marks (and the audit entry) are written together or not at all
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	if len(clear.StudentIds) > 0 {
		err := queries.DeleteMarks(ctx, dbsqlc.DeleteMarksParams{
			StudentIds:     clear.StudentIds,
			SubjectIds:     clear.SubjectIds,
			AcademicYearID: int32(req.AcademicYearID),
			Term:           int32(req.Term),
			SchoolID:       int32(schoolID),
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
		if err := queries.UpsertMarks(ctx, upsert); err != nil {
			return nil, fmt.Errorf("failed to save marks: %w", err)
		}
	}
	// Corrections to a closed term are recorded against the school, mark by mark
	if target.closed && len(changes) > 0 {
		action := "ClosedTermMarksCorrected"
		if target.pastYear {
			action = "PastMarksCorrected"
		}
		year, err := queries.GetAcademicYearByID(ctx, int32(req.AcademicYearID))
		if err != nil {
			return nil, fmt.Errorf("failed to look up academic year %d: %w", req.AcademicYearID, err)
		}
		note := fmt.Sprintf("%d Term %d: %s", year.Year, req.Term, summariseChanges(changes, 25))
		if err := recordAudit(ctx, queries, "school", schoolID, action, note); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to save marks: %w", err)
	}
	return &schema.SaveMarksResult{Saved: len(upsert.StudentIds), Cleared: len(clear.StudentIds)}, nil
}

// describeMarkChange is "Chikondi Banda, English: 45 → 60" (or "none" for no mark).
func describeMarkChange(now dbsqlc.ListMarkPairsRow, mark *int) string {
	before, after := "none", "none"
	if now.Mark.Valid {
		before = fmt.Sprint(now.Mark.Int32)
	}
	if mark != nil {
		after = fmt.Sprint(*mark)
	}
	return fmt.Sprintf("%s, %s: %s → %s", now.Learner, now.Subject, before, after)
}

// summariseChanges lists up to max changes and counts the rest.
func summariseChanges(changes []string, max int) string {
	if len(changes) <= max {
		return strings.Join(changes, "; ")
	}
	return strings.Join(changes[:max], "; ") + fmt.Sprintf("; and %d more", len(changes)-max)
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
