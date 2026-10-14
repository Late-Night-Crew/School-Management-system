package schema

// Insights holds the figures behind a dashboard's charts, for the whole country, one
// division or one school.
type Insights struct {
	LearnersByForm []FormGender     `json:"learners_by_form"`
	Gender         GenderCount      `json:"gender"`
	Disability     int              `json:"disability"`
	Statuses       []StatusCount    `json:"statuses"`
	Areas          []AreaCount      `json:"areas"`        // divisions (country) or districts (division); empty for a school
	SchoolTerms    []TermCount      `json:"school_terms"` // open schools by current term; empty for a school
	Performance    PerformanceTrend `json:"performance"`
}

type FormGender struct {
	Form   int `json:"form"`
	Male   int `json:"male"`
	Female int `json:"female"`
	Other  int `json:"other"`
}

type GenderCount struct {
	Male   int `json:"male"`
	Female int `json:"female"`
	Other  int `json:"other"`
}

type StatusCount struct {
	Status   string `json:"status"`
	Learners int    `json:"learners"`
}

type AreaCount struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Schools  int    `json:"schools"`
	Learners int    `json:"learners"`
	Female   int    `json:"female"`
}

// TermCount: Term 0 means the school has not started a term in the system.
type TermCount struct {
	Term    int `json:"term"`
	Schools int `json:"schools"`
}

// PerformanceTrend comes from the end-of-term reports. Latest is the newest term with
// marks; its breakdowns follow.
type PerformanceTrend struct {
	Terms    []TermPerformance `json:"terms"`
	Latest   *TermPerformance  `json:"latest"`
	Forms    []FormStats       `json:"forms"`
	Subjects []SubjectStats    `json:"subjects"`
	Areas    []AreaPerformance `json:"areas"`
}

type TermPerformance struct {
	Year         int      `json:"year"`
	Term         int      `json:"term"`
	Schools      int      `json:"schools"` // schools with a report for the term
	Learners     int      `json:"learners"`
	Passed       int      `json:"passed"`
	PassRate     *float64 `json:"pass_rate"`
	AverageMark  *float64 `json:"average_mark"`
	JCEPassRate  *float64 `json:"jce_pass_rate"`
	MSCEPassRate *float64 `json:"msce_pass_rate"`
	Live         bool     `json:"live"` // the school's current term, still open
}

type AreaPerformance struct {
	ID       int64    `json:"id"`
	Name     string   `json:"name"`
	Learners int      `json:"learners"`
	PassRate *float64 `json:"pass_rate"`
}
