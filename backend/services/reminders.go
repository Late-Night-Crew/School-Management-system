package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"
	_ "time/tzdata" // Africa/Blantyre on servers without time zone data

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// Term reminders (see migration 26). Schools are reminded as their term ends, and
// their division office is told when a school is two weeks overdue.

const (
	reminderEnding    = "ending"    // some days before the term ends
	reminderEnded     = "ended"     // the day the term ends
	reminderOverdue   = "overdue"   // the urgent follow-up
	reminderEscalated = "escalated" // the division office is told
)

// reminderTimes is when reminders go out (MCDE's reminder settings), in days.
type reminderTimes struct {
	before, overdue, escalate int
}

var defaultReminderTimes = reminderTimes{before: 7, overdue: 7, escalate: 14}

// malawi is the time zone that decides what "today" is for term dates.
var malawi = func() *time.Location {
	if loc, err := time.LoadLocation("Africa/Blantyre"); err == nil {
		return loc
	}
	return time.FixedZone("CAT", 2*60*60)
}()

// TodayInMalawi is today's date (at midnight UTC, like dates read from the database).
func TodayInMalawi() time.Time {
	now := time.Now().In(malawi)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

func daysBetween(from, to time.Time) int {
	return int(to.Sub(from).Hours() / 24)
}

// reminderDue is the most advanced reminder that applies today for a term ending on
// end, or "" if none does yet. Earlier reminders a late check missed are not sent.
func reminderDue(today, end time.Time, times reminderTimes) string {
	days := daysBetween(end, today) // positive once the term has ended
	switch {
	case days >= times.escalate:
		return reminderEscalated
	case days >= times.overdue:
		return reminderOverdue
	case days >= 0:
		return reminderEnded
	case -days <= times.before:
		return reminderEnding
	}
	return ""
}

type ReminderService interface {
	GetSettings(ctx context.Context) (*schema.ReminderSettings, error)
	UpdateSettings(ctx context.Context, actorID int64, req *schema.ReminderSettings) (*schema.ReminderSettings, error)
	// CreateYearWithTerms creates an academic year together with its three terms' dates.
	CreateYearWithTerms(ctx context.Context, req *schema.CreateAcademicYearRequest) (*schema.AcademicYear, error)
	// CheckYearDates refuses new year dates that would leave a term outside the year.
	CheckYearDates(ctx context.Context, yearID int64, startDate, endDate string) error
	ListTermDates(ctx context.Context) ([]schema.TermDates, error)
	// SetTermDates replaces an academic year's term dates.
	SetTermDates(ctx context.Context, actorID, yearID int64, req *schema.SetTermDatesRequest) ([]schema.TermDates, error)
	// SendDue sends the reminders due on the given day; safe to run as often as wanted.
	SendDue(ctx context.Context, today time.Time) (*schema.ReminderRun, error)
}

type reminderService struct {
	db         *sql.DB
	queries    *dbsqlc.Queries
	promotions PromotionService
	logger     logging.Logger
}

func NewReminderService(db *sql.DB, queries *dbsqlc.Queries, promotions PromotionService, logger logging.Logger) ReminderService {
	return &reminderService{db: db, queries: queries, promotions: promotions, logger: logger}
}

func (s *reminderService) times(ctx context.Context) (reminderTimes, error) {
	row, err := s.queries.GetReminderSettings(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return defaultReminderTimes, nil
	}
	if err != nil {
		return reminderTimes{}, fmt.Errorf("failed to get reminder settings: %w", err)
	}
	return reminderTimes{before: int(row.DaysBefore), overdue: int(row.OverdueAfter), escalate: int(row.EscalateAfter)}, nil
}

func (s *reminderService) GetSettings(ctx context.Context) (*schema.ReminderSettings, error) {
	t, err := s.times(ctx)
	if err != nil {
		return nil, err
	}
	return &schema.ReminderSettings{DaysBefore: t.before, OverdueAfter: t.overdue, EscalateAfter: t.escalate}, nil
}

func (s *reminderService) UpdateSettings(ctx context.Context, actorID int64, req *schema.ReminderSettings) (*schema.ReminderSettings, error) {
	if req.EscalateAfter <= req.OverdueAfter {
		return nil, newUserError(ErrInvalidMove, "Tell the division office later than the urgent reminder (more days after the term ends).")
	}
	err := s.queries.UpdateReminderSettings(ctx, dbsqlc.UpdateReminderSettingsParams{
		DaysBefore: int32(req.DaysBefore), OverdueAfter: int32(req.OverdueAfter),
		EscalateAfter: int32(req.EscalateAfter), ActorUserID: int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to save reminder settings: %w", err)
	}
	return s.GetSettings(ctx)
}

func (s *reminderService) CreateYearWithTerms(ctx context.Context, req *schema.CreateAcademicYearRequest) (*schema.AcademicYear, error) {
	start, err := time.Parse(time.DateOnly, req.StartDate)
	if err != nil {
		return nil, newUserError(ErrInvalidMove, "The start date is not a valid date.")
	}
	end, err := time.Parse(time.DateOnly, req.EndDate)
	if err != nil {
		return nil, newUserError(ErrInvalidMove, "The end date is not a valid date.")
	}
	if !end.After(start) {
		return nil, newUserError(ErrInvalidMove, "The academic year must end after it starts.")
	}
	if len(req.Terms) != 3 {
		return nil, newUserError(ErrInvalidMove, "Give the start and end dates of all three terms.")
	}
	if err := checkTermDates(start, end, req.Terms); err != nil {
		return nil, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	year, err := queries.CreateAcademicYear(ctx, dbsqlc.CreateAcademicYearParams{
		Year: int32(req.Year), StartDate: start, EndDate: end,
		Status: sql.NullString{String: req.Status, Valid: req.Status != ""},
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, newUserError(ErrInUse, "The %d academic year already exists.", req.Year)
		}
		return nil, fmt.Errorf("failed to create academic year: %w", err)
	}
	for _, t := range req.Terms {
		termStart, _ := time.Parse(time.DateOnly, t.StartDate)
		termEnd, _ := time.Parse(time.DateOnly, t.EndDate)
		if err := queries.AddTermDates(ctx, dbsqlc.AddTermDatesParams{AcademicYearID: year.ID, Term: int32(t.Term), StartDate: termStart, EndDate: termEnd}); err != nil {
			return nil, fmt.Errorf("failed to save term %d dates: %w", t.Term, err)
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to create academic year: %w", err)
	}
	return &schema.AcademicYear{ID: int64(year.ID), Year: int(year.Year), StartDate: req.StartDate, EndDate: req.EndDate, Status: req.Status}, nil
}

func (s *reminderService) CheckYearDates(ctx context.Context, yearID int64, startDate, endDate string) error {
	start, err1 := time.Parse(time.DateOnly, startDate)
	end, err2 := time.Parse(time.DateOnly, endDate)
	if err1 != nil || err2 != nil {
		return newUserError(ErrInvalidMove, "The academic year's dates are not valid dates.")
	}
	terms, err := s.queries.ListTermDatesForYear(ctx, int32(yearID))
	if err != nil {
		return fmt.Errorf("failed to get term dates: %w", err)
	}
	for _, t := range terms {
		if t.StartDate.Before(start) || t.EndDate.After(end) {
			return newUserError(ErrInvalidMove, "Term %d (%s to %s) would fall outside the year. Change the term dates first.",
				t.Term, t.StartDate.Format("2 Jan"), t.EndDate.Format("2 Jan 2006"))
		}
	}
	return nil
}

func (s *reminderService) ListTermDates(ctx context.Context) ([]schema.TermDates, error) {
	rows, err := s.queries.ListTermDates(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list term dates: %w", err)
	}
	out := make([]schema.TermDates, 0, len(rows))
	for _, r := range rows {
		out = append(out, schema.TermDates{
			AcademicYearID: int64(r.AcademicYearID), Year: int(r.Year), Term: int(r.Term),
			StartDate: r.StartDate.Format(time.DateOnly), EndDate: r.EndDate.Format(time.DateOnly),
		})
	}
	return out, nil
}

// checkTermDates: terms inside the academic year, each ending after it starts, in
// order and not overlapping.
func checkTermDates(yearStart, yearEnd time.Time, terms []schema.TermDatesInput) error {
	sorted := append([]schema.TermDatesInput{}, terms...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Term < sorted[j].Term })
	var previousEnd time.Time
	for i, t := range sorted {
		if i > 0 && t.Term == sorted[i-1].Term {
			return newUserError(ErrInvalidMove, "Term %d is listed twice.", t.Term)
		}
		start, _ := time.Parse(time.DateOnly, t.StartDate)
		end, _ := time.Parse(time.DateOnly, t.EndDate)
		if end.Before(start) {
			return newUserError(ErrInvalidMove, "Term %d ends before it starts.", t.Term)
		}
		if start.Before(yearStart) || end.After(yearEnd) {
			return newUserError(ErrInvalidMove, "Term %d must fall within the academic year (%s to %s).", t.Term, yearStart.Format("2 Jan 2006"), yearEnd.Format("2 Jan 2006"))
		}
		if i > 0 && !start.After(previousEnd) {
			return newUserError(ErrInvalidMove, "Term %d must start after Term %d ends.", t.Term, sorted[i-1].Term)
		}
		previousEnd = end
	}
	return nil
}

func (s *reminderService) SetTermDates(ctx context.Context, actorID, yearID int64, req *schema.SetTermDatesRequest) ([]schema.TermDates, error) {
	year, err := s.queries.GetAcademicYearByID(ctx, int32(yearID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get academic year %d: %w", yearID, err)
	}
	if err := checkTermDates(year.StartDate, year.EndDate, req.Terms); err != nil {
		return nil, err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	if err := queries.ClearTermDates(ctx, int32(yearID)); err != nil {
		return nil, fmt.Errorf("failed to clear term dates: %w", err)
	}
	notes := []string{}
	for _, t := range req.Terms {
		start, _ := time.Parse(time.DateOnly, t.StartDate)
		end, _ := time.Parse(time.DateOnly, t.EndDate)
		if err := queries.AddTermDates(ctx, dbsqlc.AddTermDatesParams{AcademicYearID: int32(yearID), Term: int32(t.Term), StartDate: start, EndDate: end}); err != nil {
			return nil, fmt.Errorf("failed to save term %d dates: %w", t.Term, err)
		}
		notes = append(notes, fmt.Sprintf("Term %d %s to %s", t.Term, t.StartDate, t.EndDate))
	}
	if err := queries.LogTermDatesChange(ctx, dbsqlc.LogTermDatesChangeParams{AcademicYearID: int32(yearID), ActorUserID: int32(actorID), Note: strings.Join(notes, "; ")}); err != nil {
		return nil, fmt.Errorf("failed to record term dates: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to save term dates: %w", err)
	}
	return s.ListTermDates(ctx)
}

// reminderText is a school's reminder notice: title, body and priority.
func reminderText(kind string, year, term int, end, today time.Time, times reminderTimes) (title, body, priority string) {
	date := end.Format("Monday 2 January")
	next := fmt.Sprintf("move the school to Term %d on Terms & Promotion (the term report is saved when you do)", term+1)
	if term == 3 {
		next = "finish the year-end promotion on Terms & Promotion: Term 3 marks decide who moves up, and are the JCE and MSCE results for Forms 2 and 4"
	}
	switch kind {
	case reminderEnding:
		days := daysBetween(today, end)
		return fmt.Sprintf("Term %d ends on %s", term, date),
			fmt.Sprintf("%d Term %d ends in %d day%s, on %s. Make sure every learner's Term %d marks are entered (Enter Marks). When the term ends, %s.",
				year, term, days, plural(days), date, term, next), "Normal"
	case reminderEnded:
		return fmt.Sprintf("Term %d has ended", term),
			fmt.Sprintf("%d Term %d ended on %s. Finish entering any missing Term %d marks, then %s.", year, term, date, term, next), "Normal"
	default: // overdue
		days := daysBetween(end, today)
		return fmt.Sprintf("Reminder: Term %d ended %d days ago", term, days),
			fmt.Sprintf("%d Term %d ended on %s and the school is still in Term %d. Please finish entering marks and %s. Your division office will be told if this is still open %d days after the term ended.",
				year, term, date, term, next, times.escalate), "Urgent"
	}
}

func plural(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}

func (s *reminderService) SendDue(ctx context.Context, today time.Time) (*schema.ReminderRun, error) {
	times, err := s.times(ctx)
	if err != nil {
		return nil, err
	}
	stages, err := s.promotions.ListStages(ctx)
	if err != nil {
		return nil, err
	}
	run := &schema.ReminderRun{Date: today.Format(time.DateOnly), Sent: map[string]int{}, Schools: len(stages)}
	// Schools to report to their division office, sent as one summary per division
	escalations := map[int32][]overdueSchool{}
	for _, stage := range stages {
		dates, err := s.queries.GetTermDates(ctx, dbsqlc.GetTermDatesParams{AcademicYearID: int32(stage.AcademicYearID), Term: int32(stage.Term)})
		if errors.Is(err, sql.ErrNoRows) {
			continue // MCDE has not set this term's dates
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get term dates: %w", err)
		}
		kind := reminderDue(today, dates.EndDate, times)
		if kind == "" {
			continue
		}
		if kind == reminderEscalated {
			// A school the check reaches late still gets its own urgent reminder once
			if sent, err := s.send(ctx, stage, reminderOverdue, dates.EndDate, today, times); err != nil {
				run.Failures = append(run.Failures, fmt.Sprintf("%s: %v", stage.SchoolName, err))
			} else if sent {
				run.Sent[reminderOverdue]++
			}
			region, err := s.queries.GetSchoolRegionForReminder(ctx, int32(stage.SchoolID))
			if err != nil {
				return nil, fmt.Errorf("failed to find school %d's division: %w", stage.SchoolID, err)
			}
			escalations[region.RegionID] = append(escalations[region.RegionID], overdueSchool{stage: stage, end: dates.EndDate})
			continue
		}
		sent, err := s.send(ctx, stage, kind, dates.EndDate, today, times)
		if err != nil {
			s.logger.Error("reminders", "term reminder failed", "school_id", stage.SchoolID, "kind", kind, "error", err)
			run.Failures = append(run.Failures, fmt.Sprintf("%s: %v", stage.SchoolName, err))
			continue
		}
		if sent {
			run.Sent[kind]++
		}
	}
	for regionID, schools := range escalations {
		sent, err := s.sendDivisionSummary(ctx, regionID, schools, today)
		if err != nil {
			s.logger.Error("reminders", "division summary failed", "region_id", regionID, "error", err)
			run.Failures = append(run.Failures, fmt.Sprintf("division %d: %v", regionID, err))
			continue
		}
		if sent > 0 {
			run.Sent[reminderEscalated] += sent
		}
	}
	return run, nil
}

type overdueSchool struct {
	stage *schema.SchoolStage
	end   time.Time
}

// sendDivisionSummary tells a division office, in one notice, about its schools that
// are newly overdue. Each school is reported once per term; returns how many were.
func (s *reminderService) sendDivisionSummary(ctx context.Context, regionID int32, schools []overdueSchool, today time.Time) (int, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	var lines, names []string
	for _, o := range schools {
		_, err := queries.ClaimTermReminder(ctx, dbsqlc.ClaimTermReminderParams{
			SchoolID: int32(o.stage.SchoolID), AcademicYearID: int32(o.stage.AcademicYearID), Term: int32(o.stage.Term), Kind: reminderEscalated,
		})
		if errors.Is(err, sql.ErrNoRows) {
			continue // already reported
		}
		if err != nil {
			return 0, err
		}
		waiting := "term report"
		if o.stage.Term == 3 {
			waiting = "Term 3 report and year-end promotion"
		}
		names = append(names, o.stage.SchoolName)
		lines = append(lines, fmt.Sprintf("• %s: still in %d Term %d, which ended on %s (%d days ago); its %s is waiting.",
			o.stage.SchoolName, o.stage.Year, o.stage.Term, o.end.Format("2 January"), daysBetween(o.end, today), waiting))
	}
	if len(lines) == 0 {
		return 0, nil
	}
	sort.Strings(lines)
	title := fmt.Sprintf("%d schools in your division have not closed their term", len(lines))
	if len(lines) == 1 {
		title = names[0] + " has not closed its term"
	}
	body := "These schools have not moved on although their term has ended:\n\n" + strings.Join(lines, "\n") +
		"\n\nPlease follow up with their coordinators. You will not be told about the same school again this term."
	err = queries.CreateTermReminderNotice(ctx, dbsqlc.CreateTermReminderNoticeParams{
		Title: title, Body: body, Priority: "Normal", PartyType: "REGION", PartyID: regionID,
	})
	if err != nil {
		return 0, err
	}
	return len(lines), tx.Commit()
}

// send claims and sends one reminder in a transaction; false if it was already sent.
func (s *reminderService) send(ctx context.Context, stage *schema.SchoolStage, kind string, end, today time.Time, times reminderTimes) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	_, err = queries.ClaimTermReminder(ctx, dbsqlc.ClaimTermReminderParams{
		SchoolID: int32(stage.SchoolID), AcademicYearID: int32(stage.AcademicYearID), Term: int32(stage.Term), Kind: kind,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	title, body, priority := reminderText(kind, stage.Year, stage.Term, end, today, times)
	err = queries.CreateTermReminderNotice(ctx, dbsqlc.CreateTermReminderNoticeParams{
		Title: title, Body: body, Priority: priority,
		DueDate:   sql.NullTime{Time: end, Valid: kind == reminderEnding},
		PartyType: "SCHOOL", PartyID: int32(stage.SchoolID),
	})
	if err != nil {
		return false, err
	}
	return true, tx.Commit()
}
