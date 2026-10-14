package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"nsms/database/dbsqlc"
)

// What can be recorded against an academic year. Nothing goes into an upcoming year:
// records belong to the active year, or to a past one when correcting it. Marks also
// cannot go into a term the school has not reached yet.

// ErrYearNotOpen wraps why a year or term cannot take records; the message is for the user.
var ErrYearNotOpen = errors.New("academic year not open")

// academicYearStatus is a year's status on a given day: it follows the dates.
func academicYearStatus(start, end, today time.Time) string {
	switch {
	case today.Before(start):
		return "Upcoming"
	case today.After(end):
		return "Completed"
	}
	return "Active"
}

// SyncAcademicYearStatuses brings every year's status in line with its dates.
func SyncAcademicYearStatuses(ctx context.Context, queries *dbsqlc.Queries) error {
	if err := queries.SyncAcademicYearStatuses(ctx, TodayInMalawi()); err != nil {
		return fmt.Errorf("failed to update academic year statuses: %w", err)
	}
	return nil
}

// checkYearsDontOverlap refuses year dates that overlap another academic year.
func checkYearsDontOverlap(ctx context.Context, queries *dbsqlc.Queries, excludeID int64, start, end time.Time) error {
	n, err := queries.CountOverlappingAcademicYears(ctx, dbsqlc.CountOverlappingAcademicYearsParams{ExcludeID: int32(excludeID), StartDate: start, EndDate: end})
	if err != nil {
		return fmt.Errorf("failed to check academic year dates: %w", err)
	}
	if n > 0 {
		return newUserError(ErrInvalidMove, "These dates overlap another academic year. Years follow one another without overlapping.")
	}
	return nil
}

// checkYearStarted refuses an academic year that has not started yet (by its dates).
func checkYearStarted(ctx context.Context, queries *dbsqlc.Queries, yearID int64) error {
	year, err := queries.GetAcademicYearByID(ctx, int32(yearID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrAcademicYearNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up academic year %d: %w", yearID, err)
	}
	if TodayInMalawi().Before(year.StartDate) {
		return newUserError(ErrYearNotOpen, "The %d academic year has not started yet. Record this in the active year.", year.Year)
	}
	return nil
}

// checkMarksTerm refuses marks for a term the school has not reached (a later year than
// the school is in, or a later term of its current year) and, unless canCorrectPast
// (MCDE), for a year the school has finished. It reports whether yearID is a past year.
// marksTerm says whether marks go into a term the school has closed: a finished year,
// or an earlier term of its current year. Closed terms have saved reports, so only MCDE
// corrects them, and every correction is audited.
type marksTerm struct {
	pastYear bool // a year the school has finished
	closed   bool // pastYear, or an earlier term of the current year
}

func checkMarksTerm(ctx context.Context, queries *dbsqlc.Queries, schoolID, yearID int64, term int, canCorrectPast bool) (marksTerm, error) {
	if err := checkYearStarted(ctx, queries, yearID); err != nil {
		return marksTerm{}, err
	}
	stage, err := getSchoolStage(ctx, queries, schoolID)
	if err != nil {
		return marksTerm{}, err
	}
	year, err := queries.GetAcademicYearByID(ctx, int32(yearID))
	if err != nil {
		return marksTerm{}, fmt.Errorf("failed to look up academic year %d: %w", yearID, err)
	}
	thisYear := int64(year.ID) == stage.AcademicYearID
	switch {
	case int(year.Year) > stage.Year:
		return marksTerm{}, newUserError(ErrYearNotOpen, "The school is still in %d, so it cannot record %d marks yet.", stage.Year, year.Year)
	case thisYear && term > stage.Term:
		return marksTerm{}, newUserError(ErrYearNotOpen, "The school is in Term %d of %d. Term %d marks can be entered once it moves to Term %d.", stage.Term, stage.Year, term, term)
	case int(year.Year) < stage.Year && !canCorrectPast:
		return marksTerm{}, newUserError(ErrYearNotOpen, "The school has finished %d, so its marks are locked. Only MCDE (the Learner Support Manager) can correct them.", year.Year)
	case thisYear && term < stage.Term && !canCorrectPast:
		return marksTerm{}, newUserError(ErrYearNotOpen, "Term %d of %d has closed and its report is saved, so its marks are locked. Only MCDE (the Learner Support Manager) can correct them.", term, stage.Year)
	}
	past := int(year.Year) < stage.Year
	return marksTerm{pastYear: past, closed: past || (thisYear && term < stage.Term)}, nil
}
