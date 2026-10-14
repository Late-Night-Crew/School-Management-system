package schema

// PasswordRequest is what someone who forgot their password fills in on the sign-in
// page. Division officers give their division, school users their school.
type PasswordRequest struct {
	Role         string `json:"role" validate:"required,oneof=REGIONAL_ADMIN SCHOOL_MANAGER"`
	Email        string `json:"email" validate:"required,email,max=150"`
	RegionID     int64  `json:"region_id" validate:"required_if=Role REGIONAL_ADMIN"`
	SchoolID     int64  `json:"school_id" validate:"required_if=Role SCHOOL_MANAGER"`
	ContactPhone string `json:"contact_phone" validate:"max=30"`
	Note         string `json:"note" validate:"max=500"`
}

// PasswordRequestItem is a pending request as the office handling it sees it.
type PasswordRequestItem struct {
	ID           int64  `json:"id"`
	AccountID    int64  `json:"account_id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	SchoolName   string `json:"school_name,omitempty"`
	RegionName   string `json:"region_name,omitempty"`
	Phone        string `json:"phone,omitempty"`
	WhatsApp     string `json:"whatsapp,omitempty"`
	ContactPhone string `json:"contact_phone,omitempty"`
	Note         string `json:"note,omitempty"`
	CreatedAt    string `json:"created_at"`
}

// PublicPlaces are the divisions and open schools the sign-in page lists.
type PublicPlaces struct {
	Regions []PublicPlace `json:"regions"`
	Schools []PublicPlace `json:"schools"`
}

type PublicPlace struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	RegionID int64  `json:"region_id,omitempty"`
}
