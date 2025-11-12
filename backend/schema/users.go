package schema

type UserCompact struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	CreatedAt   string `json:"createdAt"`
}

// CompactUserListResponse list of users but compact form
type CompactUserListResponse struct {
	Total int           `json:"total"`
	Users []UserCompact `json:"users"`
}

type SignUpRequest struct {
	FirstName    string `json:"first_name" validate:"required"`
	LastName     string `json:"last_name" validate:"required"`
	DisplayName  string `json:"display_name" validate:"required"`
	Email        string `json:"email" validate:"required"`
	Password     string `json:"password" validate:"required"`
	Role         string `json:"role"`
	Status       string `json:"status"`
	IsSuperAdmin bool   `json:"is_super_admin"`
}

type NewUserRequest struct {
	FirstName    string `json:"first_name" validate:"required"`
	LastName     string `json:"last_name" validate:"required"`
	DisplayName  string `json:"display_name" validate:"required"`
	Email        string `json:"email" validate:"required"`
	Password     string `json:"password" validate:"required"`
	Role         string `json:"role"`
	RegionID     *int64 `json:"region_id"`
	DistrictID   *int64 `json:"district_id"`
	SchoolID     *int64 `json:"school_id"`
	Status       string `json:"status"`
	IsSuperAdmin bool   `json:"is_super_admin"`
}

// LoginRequest to authenticate a user on the platform
type LoginRequest struct {
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse response from a login request
type LoginResponse struct {
	UserID      int64  `json:"user_id"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Role        string `json:"role"`
	RegionID    *int64 `json:"region_id"`
	DistrictID  *int64 `json:"district_id"`
	SchoolID    *int64 `json:"school_id"`
	IsSuperAdmin bool   `json:"is_super_admin"`
	Token       string `json:"token"`
	ExpiresAt   int64  `json:"expires_at"`
}

// ChangePasswordRequest request to change a password
type ChangePasswordRequest struct {
	UserID          int64  `json:"user_id" validate:"required"`
	OldPassword     string `json:"old_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}

type UpdateUserRequest struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name" validate:"required"`
	Role        string `json:"role" validate:"required"`
	Status      string `json:"status" validate:"required"`
}
