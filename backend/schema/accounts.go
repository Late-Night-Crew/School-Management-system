package schema

// Account is a regional admin or school manager as account managers see it.
type Account struct {
	ID                 int64  `json:"id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	Role               string `json:"role"`
	Phone              string `json:"phone,omitempty"`
	WhatsApp           string `json:"whatsapp,omitempty"`
	RegionID           int64  `json:"region_id,omitempty"`
	RegionName         string `json:"region_name,omitempty"`
	SchoolID           int64  `json:"school_id,omitempty"`
	SchoolName         string `json:"school_name,omitempty"`
	SchoolNumber       string `json:"school_number,omitempty"`
	DistrictName       string `json:"district_name,omitempty"`
	Active             bool   `json:"active"`
	MustChangePassword bool   `json:"must_change_password"`
	LastLoginAt        string `json:"last_login_at,omitempty"`
	CreatedAt          string `json:"created_at,omitempty"`
}

// AccountFilter narrows the account list. A regional admin's list is always limited
// to their own region.
type AccountFilter struct {
	Role     string `query:"role" validate:"omitempty,oneof=REGIONAL_ADMIN SCHOOL_MANAGER"`
	RegionID int64  `query:"region_id" validate:"omitempty,min=1"`
}

// CreateAccountRequest creates a regional admin (RegionID) or a school manager (SchoolID).
type CreateAccountRequest struct {
	Name     string `json:"name" validate:"required,max=150"`
	Email    string `json:"email" validate:"required,email,max=150"`
	Role     string `json:"role" validate:"required,oneof=REGIONAL_ADMIN SCHOOL_MANAGER"`
	RegionID int64  `json:"region_id"`
	SchoolID int64  `json:"school_id"`
	Phone    string `json:"phone"`
	WhatsApp string `json:"whatsapp"`
}

type UpdateAccountRequest struct {
	Name     string `json:"name" validate:"required,max=150"`
	Email    string `json:"email" validate:"required,email,max=150"`
	Phone    string `json:"phone"`
	WhatsApp string `json:"whatsapp"`
}

type SetAccountActiveRequest struct {
	Reason string `json:"reason" validate:"max=500"`
}

// TemporaryPassword is returned once, when an account is created or its password reset.
// It is never stored in plain text; the person must change it when they sign in.
type TemporaryPassword struct {
	Account           *Account `json:"account"`
	TemporaryPassword string   `json:"temporary_password"`
}

type UpdateOwnContactRequest struct {
	Phone    string `json:"phone"`
	WhatsApp string `json:"whatsapp"`
}

type ChangeOwnPasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=72"`
}

// PersonContact is someone's contact details in the directory. Phone and WhatsApp are
// left out when the viewer may not see that person's personal numbers.
type PersonContact struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Email    string `json:"email,omitempty"`
	Phone    string `json:"phone,omitempty"`
	WhatsApp string `json:"whatsapp,omitempty"`
}

type OfficeContact struct {
	Phone           string `json:"phone,omitempty"`
	Email           string `json:"email,omitempty"`
	PostalAddress   string `json:"postal_address,omitempty"`
	PhysicalAddress string `json:"physical_address,omitempty"`
}

type RegionDirectoryEntry struct {
	ID      int64          `json:"id"`
	Name    string         `json:"name"`
	Office  OfficeContact  `json:"office"`
	Admin   *PersonContact `json:"admin,omitempty"`
	CanEdit bool           `json:"can_edit"`
	IsOwn   bool           `json:"is_own"`
}

type SchoolDirectoryEntry struct {
	ID               int64           `json:"id"`
	Name             string          `json:"name"`
	SchoolNumber     string          `json:"school_number"`
	DistrictID       int64           `json:"district_id"`
	DistrictName     string          `json:"district_name"`
	RegionID         int64           `json:"region_id"`
	RegionName       string          `json:"region_name"`
	Office           OfficeContact   `json:"office"`
	HeadTeacherName  string          `json:"head_teacher_name,omitempty"`
	HeadTeacherPhone string          `json:"head_teacher_phone,omitempty"`
	Managers         []PersonContact `json:"managers"`
	CanEdit          bool            `json:"can_edit"`
	IsOwn            bool            `json:"is_own"`
}

// Directory is everyone the viewer can look up, with what they may see of each.
type Directory struct {
	Ministry []PersonContact         `json:"ministry"`
	Regions  []*RegionDirectoryEntry `json:"regions"`
	Schools  []*SchoolDirectoryEntry `json:"schools"`
}

type UpdateRegionOfficeRequest struct {
	Phone           string `json:"phone"`
	Email           string `json:"email" validate:"omitempty,email,max=150"`
	PostalAddress   string `json:"postal_address" validate:"max=255"`
	PhysicalAddress string `json:"physical_address" validate:"max=255"`
}

type UpdateSchoolOfficeRequest struct {
	Phone            string `json:"phone"`
	Email            string `json:"email" validate:"omitempty,email,max=150"`
	PostalAddress    string `json:"postal_address" validate:"max=255"`
	HeadTeacherName  string `json:"head_teacher_name" validate:"max=150"`
	HeadTeacherPhone string `json:"head_teacher_phone"`
}
