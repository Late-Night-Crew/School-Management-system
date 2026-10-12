package schema

// GradeBand is one letter grade on the grading scale. It covers marks from MinMark to
// MaxMark inclusive; MaxMark is worked out from the band above (100 for the top band).
type GradeBand struct {
	ID          int64   `json:"id"`
	Grade       string  `json:"grade"`
	MinMark     int     `json:"min_mark"`
	MaxMark     int     `json:"max_mark"`
	IsPass      bool    `json:"is_pass"`
	Description *string `json:"description"`
}

// GradingScale is the whole scale, highest band first. PassMark is the lowest mark
// that counts as a pass.
type GradingScale struct {
	Bands     []GradeBand `json:"bands"`
	PassMark  int         `json:"pass_mark"`
	UpdatedAt string      `json:"updated_at"`
}

// GradeBandInput is one band in a SaveGradingScaleRequest. MinMark is a pointer
// because 0 is a valid lower bound.
type GradeBandInput struct {
	Grade       string  `json:"grade" validate:"required,max=10"`
	MinMark     *int    `json:"min_mark" validate:"required,min=0,max=100"`
	IsPass      bool    `json:"is_pass"`
	Description *string `json:"description" validate:"omitempty,max=100"`
}

// SaveGradingScaleRequest replaces the whole grading scale. Bands may come in any order.
type SaveGradingScaleRequest struct {
	Bands []GradeBandInput `json:"bands" validate:"required,min=2,max=12,dive"`
}
