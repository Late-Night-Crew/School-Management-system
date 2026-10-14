package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"nsms/database/dbsqlc"
)

// What can be recorded against an academic year. Nothing goes into an upcoming year:
// records belong to the active year, or to a past one when correcting it. Marks also
// cannot go into a term the school has not reached yet.

// ErrYearNotOpen wraps why a year or term cannot take records; the message is for the user.
var ErrYearNotOpen = errors.New("academic year not open")

const academicYearUpcoming = "Upcoming"

// checkYearStarted refuses an academic year that has not started (status Upcoming).
func checkYearStarted(ctx context.Context, queries *dbsqlc.Queries, yearID int64) error {
	year, err := queries.GetAcademicYearByID(ctx, int32(yearID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrAcademicYearNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up academic year %d: %w", yearID, err)
	}
	if year.Status.String == academicYearUpcoming {
		return newUserError(ErrYearNotOpen, "The %d academic year has not started yet. Record this in the active year.", year.Year)
	}
	return nil
}

// checkMarksTerm refuses marks for a term the school has not reached (a later year than
// the school is in, or a later term of its current year) and, unless canCorrectPast
// (MCDE), for a year the school has finished. It reports whether yearID is a past year.
func checkMarksTerm(ctx context.Context, queries *dbsqlc.Queries, schoolID, yearID int64, term int, canCorrectPast bool) (past bool, err error) {
	if err := checkYearStarted(ctx, queries, yearID); err != nil {
		return false, err
	}
	stage, err := getSchoolStage(ctx, queries, schoolID)
	if err != nil {
		return false, err
	}
	year, err := queries.GetAcademicYearByID(ctx, int32(yearID))
	if err != nil {
		return false, fmt.Errorf("failed to look up academic year %d: %w", yearID, err)
	}
	switch {
	case int(year.Year) > stage.Year:
		return false, newUserError(ErrYearNotOpen, "The school is still in %d, so it cannot record %d marks yet.", stage.Year, year.Year)
	case int64(year.ID) == stage.AcademicYearID && term > stage.Term:
		return false, newUserError(ErrYearNotOpen, "The school is in Term %d of %d. Term %d marks can be entered once it moves to Term %d.", stage.Term, stage.Year, term, term)
	case int(year.Year) < stage.Year && !canCorrectPast:
		return false, newUserError(ErrYearNotOpen, "The school has finished %d, so its marks are locked. Only MCDE (the Learner Support Manager) can correct them.", year.Year)
	}
	return int(year.Year) < stage.Year, nil
}
