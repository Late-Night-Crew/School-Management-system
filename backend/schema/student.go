package schema

type Student struct {
	ID             int64  `json:"id"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Age            int    `json:"age"`
	FormLevel      int    `json:"form_level"`
	StudentNumber  string `json:"student_number"`
	SchoolID       int64  `json:"school_id"`
	DateOfBirth    string `json:"date_of_birth"`
	AcademicYearID int64  `json:"academic_year_id"`
	Status         string `json:"status"`
	Gender         string `json:"gender"`
	GuardianName   string `json:"guardian_name"`
	PreviousSchool string `json:"previous_school"`
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
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	FormLevel      int    `json:"form_level"`
	SchoolID       int64  `json:"school_id"`
	DateOfBirth    string `json:"date_of_birth"`
	AcademicYearID int64  `json:"academic_year_id"`
	Status         string `json:"status"`
	GuardianName   string `json:"guardian_name"`
	PreviousSchool string `json:"previous_school"`
	Gender         string `json:"gender"`
	StudentNumber  string `json:"student_number"`
}

type UpdateStudentRequest struct {
	ID             int64  `json:"id"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	FormLevel      int    `json:"form_level"`
	SchoolID       int64  `json:"school_id"`
	DateOfBirth    string `json:"date_of_birth"`
	AcademicYearID int64  `json:"academic_year_id"`
	Status         string `json:"status"`
	GuardianName   string `json:"guardian_name"`
	PreviousSchool string `json:"previous_school"`
	Gender         string `json:"gender"`
	StudentNumber  string `json:"student_number"`
}
