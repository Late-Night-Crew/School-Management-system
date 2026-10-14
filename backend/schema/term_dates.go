package schema

// TermDates is when one term of an academic year runs (dates as YYYY-MM-DD).
type TermDates struct {
	AcademicYearID int64  `json:"academic_year_id"`
	Year           int    `json:"year"`
	Term           int    `json:"term"`
	StartDate      string `json:"start_date"`
	EndDate        string `json:"end_date"`
}

type TermDatesInput struct {
	Term      int    `json:"term" validate:"required,min=1,max=3"`
	StartDate string `json:"start_date" validate:"required,datetime=2006-01-02"`
	EndDate   string `json:"end_date" validate:"required,datetime=2006-01-02"`
}

// SetTermDatesRequest replaces an academic year's term dates.
type SetTermDatesRequest struct {
	Terms []TermDatesInput `json:"terms" validate:"max=3,dive"`
}

// ReminderRun says what one run of the reminder check sent.
type ReminderRun struct {
	Date     string         `json:"date"`
	Sent     map[string]int `json:"sent"`
	Schools  int            `json:"schools_checked"`
	Failures []string       `json:"failures,omitempty"`
}

// ReminderSettings: when term reminders go out, in days.
type ReminderSettings struct {
	DaysBefore    int `json:"days_before" validate:"required,min=1,max=60"`
	OverdueAfter  int `json:"overdue_after" validate:"required,min=1,max=60"`
	EscalateAfter int `json:"escalate_after" validate:"required,min=2,max=90"`
}
