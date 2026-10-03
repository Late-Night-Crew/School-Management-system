package schema

// StudentMark is one mark (0-100) for a student in a subject, academic year and term.
type StudentMark struct {
	ID             int64  `json:"id"`
	StudentID      int64  `json:"student_id"`
	SubjectID      int64  `json:"subject_id"`
	AcademicYearID int64  `json:"academic_year_id"`
	Term           int    `json:"term"`
	Mark           int    `json:"mark"`
	SchoolID       int64  `json:"school_id"`
	UpdatedAt      string `json:"updated_at,omitempty"`
}

// MarksFilter narrows a school's marks. Zero values mean "no filter".
type MarksFilter struct {
	AcademicYearID int64
	Term           int
	StudentID      int64
}

// MarkEntry sets one mark; a null mark clears it.
type MarkEntry struct {
	StudentID int64 `json:"student_id" validate:"required"`
	SubjectID int64 `json:"subject_id" validate:"required"`
	Mark      *int  `json:"mark" validate:"omitempty,min=0,max=100"`
}

// SaveMarksRequest saves a batch of marks for one academic year and term.
type SaveMarksRequest struct {
	AcademicYearID int64       `json:"academic_year_id" validate:"required"`
	Term           int         `json:"term" validate:"required,min=1,max=3"`
	Marks          []MarkEntry `json:"marks" validate:"required,min=1,dive"`
}

type SaveMarksResult struct {
	Saved   int `json:"saved"`
	Cleared int `json:"cleared"`
}
