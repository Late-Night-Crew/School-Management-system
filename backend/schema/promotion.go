package schema

// Year-end outcomes for a learner (see migration 24)
const (
	OutcomePromoted  = "Promoted"  // passed; moves up a form
	OutcomeRepeat    = "Repeat"    // stays in the same form
	OutcomeProceeded = "Proceeded" // failed Form 1 or 3 but allowed to move up
	OutcomeCompleted = "Completed" // passed Form 4 (national exams)
	OutcomeRewrite   = "Rewrite"   // failed Form 4; re-enrols in Form 4 to rewrite
)

// StudentStatusCompleted marks a learner who has finished Form 4.
const StudentStatusCompleted = "Completed"

// PromotionSettings: Forms 1 and 3 pass by SubjectsToPass; Form 2 (JCE) and Form 4
// (MSCE) follow MANEB's rule: their number of subjects plus every compulsory subject.
type PromotionSettings struct {
	Automatic          bool         `json:"automatic"`
	SubjectsToPass     int          `json:"subjects_to_pass"`
	JCESubjectsToPass  int          `json:"jce_subjects_to_pass"`
	MSCESubjectsToPass int          `json:"msce_subjects_to_pass"`
	JCECompulsory      []SubjectRef `json:"jce_compulsory"`
	MSCECompulsory     []SubjectRef `json:"msce_compulsory"`
	UpdatedAt          string       `json:"updated_at"`
}

type SubjectRef struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type UpdatePromotionSettingsRequest struct {
	Automatic          bool    `json:"automatic"`
	SubjectsToPass     int     `json:"subjects_to_pass" validate:"required,min=1,max=20"`
	JCESubjectsToPass  int     `json:"jce_subjects_to_pass" validate:"required,min=1,max=20"`
	MSCESubjectsToPass int     `json:"msce_subjects_to_pass" validate:"required,min=1,max=20"`
	JCECompulsoryIDs   []int64 `json:"jce_compulsory_ids" validate:"max=20"`
	MSCECompulsoryIDs  []int64 `json:"msce_compulsory_ids" validate:"max=20"`
}

// SchoolStage is the academic year and term a school is in.
type SchoolStage struct {
	SchoolID       int64  `json:"school_id"`
	SchoolName     string `json:"school_name,omitempty"`
	SchoolNumber   string `json:"school_number,omitempty"`
	DistrictName   string `json:"district_name,omitempty"`
	RegionName     string `json:"region_name,omitempty"`
	Learners       int    `json:"learners,omitempty"`
	AcademicYearID int64  `json:"academic_year_id"`
	Year           int    `json:"year"`
	Term           int    `json:"term"`
	// NextYear is the academic year the school moves to after Term 3 (nil if MCDE has
	// not created it yet)
	NextYearID int64 `json:"next_year_id,omitempty"`
	NextYear   int   `json:"next_year,omitempty"`
	// The current term's dates, when MCDE has set them; DaysOverdue > 0 once the term
	// has ended and the school has not moved on
	TermStartDate string `json:"term_start_date,omitempty"`
	TermEndDate   string `json:"term_end_date,omitempty"`
	DaysOverdue   int    `json:"days_overdue,omitempty"`
	// CanMoveOn: the term has ended, so the school may move to the next term (or, after
	// Term 3, finish the year). Not before the term's end date, nor without term dates.
	CanMoveOn bool `json:"can_move_on"`
}

// YearEndLearner is a learner's Term 3 result and what can be decided for them.
type YearEndLearner struct {
	StudentID      int64  `json:"student_id"`
	Name           string `json:"name"`
	StudentNumber  string `json:"student_number"`
	FormLevel      int    `json:"form_level"`
	SubjectsPassed int    `json:"subjects_passed"`
	SubjectsMarked int    `json:"subjects_marked"`
	SubjectsNeeded int    `json:"subjects_needed"`
	// MissedCompulsory: Form 2/4 learner did not pass every compulsory exam subject
	MissedCompulsory bool     `json:"missed_compulsory"`
	Passed           bool     `json:"passed"`
	Recommended      string   `json:"recommended"`
	Allowed          []string `json:"allowed"`
}

// YearEndPreview is everything the year-end screen needs for one school.
type YearEndPreview struct {
	Stage          SchoolStage      `json:"stage"`
	Automatic      bool             `json:"automatic"`
	SubjectsToPass int              `json:"subjects_to_pass"`
	PassMark       int              `json:"pass_mark"`
	Learners       []YearEndLearner `json:"learners"`
}

type YearEndDecision struct {
	StudentID int64  `json:"student_id" validate:"required,min=1"`
	Outcome   string `json:"outcome" validate:"required,oneof=Promoted Repeat Proceeded Completed Rewrite"`
}

// ApplyYearEndRequest finishes Term 3. Learners without a decision get the recommended
// outcome.
type ApplyYearEndRequest struct {
	Decisions []YearEndDecision `json:"decisions" validate:"max=5000,dive"`
}

type YearEndSummary struct {
	SchoolID int64          `json:"school_id"`
	Outcomes map[string]int `json:"outcomes"`
	NextYear int            `json:"next_year"`
	Error    string         `json:"error,omitempty"`
}

// YearResult is a learner's recorded year-end outcome.
type YearResult struct {
	StudentID      int64  `json:"student_id"`
	Name           string `json:"name"`
	StudentNumber  string `json:"student_number"`
	FromForm       int    `json:"from_form"`
	ToForm         int    `json:"to_form"`
	SubjectsPassed int    `json:"subjects_passed"`
	Outcome        string `json:"outcome"`
	Automatic      bool   `json:"automatic"`
	DecidedByName  string `json:"decided_by_name"`
	DecidedAt      string `json:"decided_at"`
	// CanProceed: a Form 1 or 3 learner who failed can still be allowed to move up
	CanProceed bool `json:"can_proceed"`
}

// YearResults is a school's results for the year it just finished.
type YearResults struct {
	AcademicYearID int64        `json:"academic_year_id"`
	Year           int          `json:"year"`
	Results        []YearResult `json:"results"`
}

type AdvanceAllRequest struct {
	FromTerm int `json:"from_term" validate:"required,min=1,max=2"`
}
