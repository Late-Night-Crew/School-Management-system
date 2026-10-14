package services

import (
	"testing"
	"time"

	"nsms/schema"
)

func day(s string) time.Time {
	t, _ := time.Parse(time.DateOnly, s)
	return t
}

func TestReminderDue(t *testing.T) {
	end := day("2026-12-11")
	for today, want := range map[string]string{
		"2026-12-01": "",             // more than a week away
		"2026-12-04": reminderEnding, // 7 days before
		"2026-12-10": reminderEnding,
		"2026-12-11": reminderEnded, // the last day
		"2026-12-17": reminderEnded,
		"2026-12-18": reminderOverdue,   // a week after
		"2026-12-25": reminderEscalated, // two weeks after
		"2027-02-01": reminderEscalated,
	} {
		if got := reminderDue(day(today), end, defaultReminderTimes); got != want {
			t.Errorf("%s: got %q, want %q", today, got, want)
		}
	}
}

func TestCheckTermDates(t *testing.T) {
	yearStart, yearEnd := day("2026-01-05"), day("2026-11-27")
	good := []schema.TermDatesInput{
		{Term: 2, StartDate: "2026-04-20", EndDate: "2026-07-24"},
		{Term: 1, StartDate: "2026-01-05", EndDate: "2026-04-03"},
		{Term: 3, StartDate: "2026-08-17", EndDate: "2026-11-27"},
	}
	if err := checkTermDates(yearStart, yearEnd, good); err != nil {
		t.Fatalf("valid dates rejected: %v", err)
	}
	bad := map[string][]schema.TermDatesInput{
		"ends before it starts": {{Term: 1, StartDate: "2026-03-01", EndDate: "2026-02-01"}},
		"outside the year":      {{Term: 3, StartDate: "2026-08-17", EndDate: "2026-12-11"}},
		"overlapping":           {{Term: 1, StartDate: "2026-01-05", EndDate: "2026-04-30"}, {Term: 2, StartDate: "2026-04-20", EndDate: "2026-07-24"}},
		"term listed twice":     {{Term: 1, StartDate: "2026-01-05", EndDate: "2026-02-01"}, {Term: 1, StartDate: "2026-03-01", EndDate: "2026-04-01"}},
	}
	for name, terms := range bad {
		if err := checkTermDates(yearStart, yearEnd, terms); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}
}

func TestReminderDueUsesSettings(t *testing.T) {
	times := reminderTimes{before: 3, overdue: 2, escalate: 5}
	end := day("2026-12-11")
	for today, want := range map[string]string{
		"2026-12-07": "", "2026-12-08": reminderEnding, "2026-12-13": reminderOverdue, "2026-12-16": reminderEscalated,
	} {
		if got := reminderDue(day(today), end, times); got != want {
			t.Errorf("%s: got %q, want %q", today, got, want)
		}
	}
}
