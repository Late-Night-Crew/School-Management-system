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
}

type GetStudentListRequest struct {
	IDs            []int64 `json:"ids"`
	FirstName      string  `json:"first_name"`
	LastName       string  `json:"last_name"`
	FormLevel      int     `json:"form_level"`
	SchoolID       int64   `json:"school_id"`
	AcademicYearID int64   `json:"academic_year_id"`
	Status         string  `json:"status"`
}

type CreateStudentRequest struct {
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
	GuardianFirstname    string  `json:"guardian_firstname"`
	GuardianMiddlename   string  `json:"guardian_middlename"`
	GuardianLastname     string  `json:"guardian_lastname"`
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
}

type UpdateStudentRequest struct {
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
	GuardianFirstname    string  `json:"guardian_firstname"`
	GuardianMiddlename   string  `json:"guardian_middlename"`
	GuardianLastname     string  `json:"guardian_lastname"`
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
	Reason        string `json:"reason"`
}
