package schema

// TermReport is a school's results for one term, saved when the term closed.
type TermReport struct {
	SchoolID         int64              `json:"school_id"`
	AcademicYearID   int64              `json:"academic_year_id"`
	Year             int                `json:"year"`
	Term             int                `json:"term"`
	LearnersAssessed int                `json:"learners_assessed"`
	AverageMark      *float64           `json:"average_mark"`
	PassRate         *float64           `json:"pass_rate"`
	JCEPassRate      *float64           `json:"jce_pass_rate"`
	MSCEPassRate     *float64           `json:"msce_pass_rate"`
	Details          *TermReportDetails `json:"details,omitempty"`
	GeneratedByName  string             `json:"generated_by_name,omitempty"`
	GeneratedAt      string             `json:"generated_at,omitempty"`
	// OutOfDate: marks for the term changed after the report was saved
	OutOfDate bool `json:"out_of_date"`
	// Live: worked out now for the current term, not saved
	Live bool `json:"live,omitempty"`
}

// TermReportDetails is the breakdown saved with a report, and the rules used.
type TermReportDetails struct {
	PassMark int            `json:"pass_mark"`
	Forms    []FormStats    `json:"forms"`
	Subjects []SubjectStats `json:"subjects"`
}

// FormStats: how one form did. Passed learners met the form's rule (Form 2/4: the
// JCE/MSCE rule including compulsory subjects).
type FormStats struct {
	Form           int      `json:"form"`
	Learners       int      `json:"learners"`
	AverageMark    *float64 `json:"average_mark"`
	Passed         int      `json:"passed"`
	PassRate       *float64 `json:"pass_rate"`
	SubjectsNeeded int      `json:"subjects_needed"`
}

type SubjectStats struct {
	SubjectID   int64    `json:"subject_id"`
	Name        string   `json:"name"`
	Marks       int      `json:"marks"`
	AverageMark *float64 `json:"average_mark"`
	PassRate    *float64 `json:"pass_rate"`
}

type TermReportFilter struct {
	AcademicYearID int64 `query:"academic_year_id" validate:"required,min=1"`
	Term           int   `query:"term" validate:"required,min=1,max=3"`
	RegionID       int64 `query:"region_id"`
}

// SchoolTermRow is one school's headline figures for a term, for comparisons.
type SchoolTermRow struct {
	SchoolID         int64    `json:"school_id"`
	SchoolName       string   `json:"school_name"`
	SchoolNumber     string   `json:"school_number"`
	DistrictName     string   `json:"district_name"`
	RegionID         int64    `json:"region_id"`
	RegionName       string   `json:"region_name"`
	LearnersAssessed int      `json:"learners_assessed"`
	AverageMark      *float64 `json:"average_mark"`
	PassRate         *float64 `json:"pass_rate"`
	JCEPassRate      *float64 `json:"jce_pass_rate"`
	MSCEPassRate     *float64 `json:"msce_pass_rate"`
	GeneratedAt      string   `json:"generated_at"`
}

// TermProgress is one learner's results in one term.
type TermProgress struct {
	AcademicYearID int64   `json:"academic_year_id"`
	Year           int     `json:"year"`
	Term           int     `json:"term"`
	SchoolName     string  `json:"school_name"`
	SubjectsMarked int     `json:"subjects_marked"`
	SubjectsPassed int     `json:"subjects_passed"`
	AverageMark    float64 `json:"average_mark"`
}

type LearnerProgress struct {
	PassMark int            `json:"pass_mark"`
	Terms    []TermProgress `json:"terms"`
}
