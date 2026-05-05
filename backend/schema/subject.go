package schema

import "time"

type Subject struct {
	ID          int32     `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateSubjectRequest struct {
	Code        string  `json:"code" validate:"required,max=50"`
	Name        string  `json:"name" validate:"required,max=150"`
	Description *string `json:"description"`
}

type UpdateSubjectRequest struct {
	ID          int32   `json:"id" validate:"required"`
	Code        string  `json:"code" validate:"required,max=50"`
	Name        string  `json:"name" validate:"required,max=150"`
	Description *string `json:"description"`
}
