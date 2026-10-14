package schema

type Student struct {
	ID                   int64   `json:"id"`
	StudentNumber        string  `json:"student_number"`
	FirstName            string  `json:"first_name"`
	MiddleName           string  `json:"middle_name"`
	LastName             string  `json:"last_name"`
	Gender               string  `json:"gender"`
	FormLevel            int     `json:"form_level"`
	DateOfBirth          string  `json:"date_of_birth"`
	SchoolID             int64   `json:"school_id"`
	AcademicYearID       int64   `json:"academic_year_id"`
	Status               string  `json:"status"`
	GuardianName         string  `json:"guardian_name"`
	GuardianPhone        string  `json:"guardian_phone"`
	GuardianAltPhone     string  `json:"guardian_alt_phone"`
	GuardianEmail        string  `json:"guardian_email"`
	GuardianRelationship string  `json:"guardian_relationship"`
	PreviousSchool       string  `json:"previous_school"`
	PreviousSchoolID     int64   `json:"previous_school_id"`
	Disability           bool    `json:"disability"`
	DisabilityDetails    string  `json:"disability_details"`
	SubjectIDs           []int64 `json:"subject_ids"`
	// NationalID and JCENumber tell apart learners with the same name. Both optional
	// (Form 1 applicants often have neither) but unique when given.
	NationalID string `json:"national_id"`
	JCENumber  string `json:"jce_number"`
	// Status is Active, Withdrawn, DroppedOut or Completed; LeftOn and LeavingReason
	// say when and why a learner left (the reason is optional)
	LeftOn        string `json:"left_on,omitempty"`
	LeavingReason string `json:"leaving_reason,omitempty"`
}

type CreateStudentRequest struct {
	StudentNumber        string  `json:"student_number" validate:"required,max=50"`
	FirstName            string  `json:"first_name" validate:"required,max=100"`
	MiddleName           string  `json:"middle_name" validate:"max=100"`
	LastName             string  `json:"last_name" validate:"required,max=100"`
	Gender               string  `json:"gender" validate:"omitempty,oneof=Male Female"`
	FormLevel            int     `json:"form_level" validate:"required,min=1,max=4"`
	DateOfBirth          string  `json:"date_of_birth" validate:"omitempty,datetime=2006-01-02"`
	SchoolID             int64   `json:"school_id"`
	AcademicYearID       int64   `json:"academic_year_id"`
	Status               string  `json:"status" validate:"max=50"`
	GuardianFirstname    string  `json:"guardian_firstname" validate:"max=50"`
	GuardianMiddlename   string  `json:"guardian_middlename" validate:"max=50"`
	GuardianLastname     string  `json:"guardian_lastname" validate:"max=50"`
	GuardianName         string  `json:"guardian_name" validate:"max=150"`
	GuardianPhone        string  `json:"guardian_phone" validate:"max=50"`
	GuardianAltPhone     string  `json:"guardian_alt_phone" validate:"max=50"`
	GuardianEmail        string  `json:"guardian_email" validate:"omitempty,email,max=150"`
	GuardianRelationship string  `json:"guardian_relationship" validate:"max=100"`
	PreviousSchool       string  `json:"previous_school" validate:"max=150"`
	PreviousSchoolID     int64   `json:"previous_school_id"`
	Disability           bool    `json:"disability"`
	DisabilityDetails    string  `json:"disability_details" validate:"max=255"`
	SubjectIDs           []int64 `json:"subject_ids" validate:"max=30"`
	// NationalID and JCENumber tell apart learners with the same name. Both optional
	// (Form 1 applicants often have neither) but unique when given.
	NationalID string `json:"national_id"`
	JCENumber  string `json:"jce_number"`
}

type UpdateStudentRequest struct {
	ID                   int64   `json:"id"`
	StudentNumber        string  `json:"student_number" validate:"required,max=50"`
	FirstName            string  `json:"first_name" validate:"required,max=100"`
	MiddleName           string  `json:"middle_name" validate:"max=100"`
	LastName             string  `json:"last_name" validate:"required,max=100"`
	Gender               string  `json:"gender" validate:"omitempty,oneof=Male Female"`
	FormLevel            int     `json:"form_level" validate:"omitempty,min=1,max=4"`
	DateOfBirth          string  `json:"date_of_birth" validate:"omitempty,datetime=2006-01-02"`
	SchoolID             int64   `json:"school_id"`
	AcademicYearID       int64   `json:"academic_year_id"`
	Status               string  `json:"status" validate:"max=50"`
	GuardianFirstname    string  `json:"guardian_firstname" validate:"max=50"`
	GuardianMiddlename   string  `json:"guardian_middlename" validate:"max=50"`
	GuardianLastname     string  `json:"guardian_lastname" validate:"max=50"`
	GuardianName         string  `json:"guardian_name" validate:"max=150"`
	GuardianPhone        string  `json:"guardian_phone" validate:"max=50"`
	GuardianAltPhone     string  `json:"guardian_alt_phone" validate:"max=50"`
	GuardianEmail        string  `json:"guardian_email" validate:"omitempty,email,max=150"`
	GuardianRelationship string  `json:"guardian_relationship" validate:"max=100"`
	PreviousSchool       string  `json:"previous_school" validate:"max=150"`
	PreviousSchoolID     int64   `json:"previous_school_id"`
	Disability           bool    `json:"disability"`
	DisabilityDetails    string  `json:"disability_details" validate:"max=255"`
	SubjectIDs           []int64 `json:"subject_ids" validate:"max=30"`
	// NationalID and JCENumber tell apart learners with the same name. Both optional
	// (Form 1 applicants often have neither) but unique when given.
	NationalID string `json:"national_id"`
	JCENumber  string `json:"jce_number"`
}

// Learner statuses (see migration 29)
const (
	StudentActive     = "Active"
	StudentWithdrawn  = "Withdrawn"
	StudentDroppedOut = "DroppedOut"
)

// LeaveRequest marks a learner as having left: Withdrawn (formally) or DroppedOut
// (stopped coming). The reason is optional; LeftOn defaults to today.
type LeaveRequest struct {
	Status string `json:"status" validate:"required,oneof=Withdrawn DroppedOut"`
	LeftOn string `json:"left_on" validate:"omitempty,datetime=2006-01-02"`
	Reason string `json:"reason" validate:"max=500"`
}

// DuplicateCheckRequest is a learner being registered or edited (ExcludeID), checked
// against existing learners before saving.
type DuplicateCheckRequest struct {
	FirstName     string `query:"first_name"`
	LastName      string `query:"last_name"`
	DateOfBirth   string `query:"date_of_birth"`
	GuardianPhone string `query:"guardian_phone"`
	ExcludeID     int64  `query:"exclude_id"`
}

// SimilarLearner is an existing learner who may be the same person. Only what is
// needed to recognise them is shown, as it may be another school's learner.
type SimilarLearner struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	StudentNumber string `json:"student_number"`
	SchoolName    string `json:"school_name"`
	FormLevel     int    `json:"form_level"`
	HasNationalID bool   `json:"has_national_id"`
	Status        string `json:"status"`
	Reason        string `json:"reason"`
}

// StudentSearch filters a learner list. The route fixes the division or school for
// division and school users; Status is Active, Left (withdrawn or dropped out) or
// Completed. PageSize goes up to 5000 for downloads.
type StudentSearch struct {
	RegionID   int64  `query:"region_id"`
	DistrictID int64  `query:"district_id"`
	SchoolID   int64  `query:"school_id"`
	FormLevel  int    `query:"form_level" validate:"omitempty,min=1,max=4"`
	Status     string `query:"status" validate:"omitempty,oneof=Active Left Completed"`
	Search     string `query:"q" validate:"max=100"`
	Page       int    `query:"page" validate:"omitempty,min=1,max=100000"`
	PageSize   int    `query:"page_size" validate:"omitempty,min=1,max=5000"`
	// Overview leaves out personal details (guardians, IDs, date of birth, disability,
	// leaving reason): the division's list shows only who and where learners are
	Overview bool `query:"-"`
	// Export marks a spreadsheet download, which is recorded in the activity log
	Export bool `query:"export"`
}

// StudentListItem is a learner with where they are.
type StudentListItem struct {
	Student
	SchoolName   string `json:"school_name"`
	DistrictID   int64  `json:"district_id"`
	DistrictName string `json:"district_name"`
	RegionID     int64  `json:"region_id"`
	RegionName   string `json:"region_name"`
}

type StudentPage struct {
	Students []StudentListItem `json:"students"`
	Total    int               `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}
