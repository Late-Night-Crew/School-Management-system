package schema

// School registration requests: the online version of MCDE's paper "Registration form
// for an Open Secondary School". The form is saved as a draft while it is being filled
// in, so every field is optional here; SubmitSchoolRequest checks it is complete.

const (
	SchoolRequestDraft     = "Draft"
	SchoolRequestSubmitted = "Submitted"
	SchoolRequestAccepted  = "Accepted"
)

// Where the host school is (Part A "Location")
const (
	LocationUrban     = "URBAN"
	LocationSemiUrban = "SEMI_URBAN"
	LocationRural     = "RURAL"
	LocationRemote    = "REMOTE"
)

// Where the OSS will run (Part A "Place to run the OSS")
const (
	VenueHostSchool    = "HOST_SCHOOL"
	VenuePrimarySchool = "PRIMARY_SCHOOL"
	VenueRented        = "RENTED"
	VenueOther         = "OTHER"
)

type SchoolRequestHeadTeacher struct {
	Name  string `json:"name" validate:"max=150"`
	Phone string `json:"phone" validate:"max=30"`
	Email string `json:"email" validate:"omitempty,email,max=150"`
}

type SchoolRequestFacilitator struct {
	Name               string `json:"name" validate:"max=150"`
	Qualification      string `json:"qualification" validate:"max=150"`
	SubjectCombination string `json:"subject_combination" validate:"max=150"`
}

// SchoolRequestCoordinator runs the OSS and registers its learners: accepting the
// request gives them the school's school manager account, using this email.
type SchoolRequestCoordinator struct {
	Name           string `json:"name" validate:"max=150"`
	Qualifications string `json:"qualifications" validate:"max=255"`
	Email          string `json:"email" validate:"omitempty,email,max=150"`
	Phone          string `json:"phone" validate:"max=30"`
}

// SchoolRequestEnrolment is the initial enrolment per form. Pointers tell "not filled
// in" apart from 0.
type SchoolRequestEnrolment struct {
	Form1 *int `json:"form1" validate:"omitempty,min=0,max=10000"`
	Form2 *int `json:"form2" validate:"omitempty,min=0,max=10000"`
	Form3 *int `json:"form3" validate:"omitempty,min=0,max=10000"`
	Form4 *int `json:"form4" validate:"omitempty,min=0,max=10000"`
}

// SchoolRequestForm is everything on the paper form that the division fills in.
type SchoolRequestForm struct {
	SchoolName   string                     `json:"school_name" validate:"max=100"`
	DistrictID   int64                      `json:"district_id" validate:"omitempty,min=1"`
	Location     string                     `json:"location" validate:"omitempty,oneof=URBAN SEMI_URBAN RURAL REMOTE"`
	Address      string                     `json:"address" validate:"max=1000"`
	HeadTeacher  SchoolRequestHeadTeacher   `json:"head_teacher"`
	VenueType    string                     `json:"venue_type" validate:"omitempty,oneof=HOST_SCHOOL PRIMARY_SCHOOL RENTED OTHER"`
	VenueName    string                     `json:"venue_name" validate:"max=255"`
	Facilitators []SchoolRequestFacilitator `json:"facilitators" validate:"max=30,dive"`
	Coordinator  SchoolRequestCoordinator   `json:"coordinator"`
	Enrolment    SchoolRequestEnrolment     `json:"enrolment"`
	DistanceKm   *float64                   `json:"distance_km" validate:"omitempty,min=0,max=1000"`
	// PTAMembers are the names of the PTA/Board of Governors members (Part B)
	PTAMembers []string `json:"pta_members" validate:"max=30,dive,max=150"`
}

// SchoolRequest is a request with its form and where it is in the process.
type SchoolRequest struct {
	ID                 int64              `json:"id"`
	Status             string             `json:"status"`
	RegionID           int64              `json:"region_id"`
	RegionName         string             `json:"region_name"`
	DistrictID         int64              `json:"district_id"`
	DistrictName       string             `json:"district_name"`
	SchoolName         string             `json:"school_name"`
	Form               *SchoolRequestForm `json:"form,omitempty"`
	CreatedByName      string             `json:"created_by_name,omitempty"`
	SubmittedAt        string             `json:"submitted_at,omitempty"`
	SubmittedByName    string             `json:"submitted_by_name,omitempty"`
	DecidedAt          string             `json:"decided_at,omitempty"`
	DecidedByName      string             `json:"decided_by_name,omitempty"`
	RegistrationNumber string             `json:"registration_number,omitempty"`
	SchoolID           int64              `json:"school_id,omitempty"`
	CreatedAt          string             `json:"created_at"`
	UpdatedAt          string             `json:"updated_at"`
	// History is every step taken on the request, oldest first (detail view only)
	History []SchoolRequestEvent `json:"history,omitempty"`
}

type SchoolRequestEvent struct {
	Action    string `json:"action"`
	ActorName string `json:"actor_name"`
	ActorRole string `json:"actor_role"`
	Note      string `json:"note,omitempty"`
	At        string `json:"at"`
}

type SchoolRequestFilter struct {
	Status string `query:"status" validate:"omitempty,oneof=Draft Submitted Accepted"`
}

// AcceptSchoolRequest gives the registration number. The coordinator named on the form
// gets the new school's school manager account.
type AcceptSchoolRequest struct {
	RegistrationNumber string `json:"registration_number" validate:"required,max=100"`
}

type AcceptSchoolRequestResult struct {
	SchoolID int64 `json:"school_id"`
	// Account is the coordinator's new account and temporary password
	Account *TemporaryPassword `json:"account,omitempty"`
	// AccountError says why the account could not be created; the school still was
	AccountError string `json:"account_error,omitempty"`
}
