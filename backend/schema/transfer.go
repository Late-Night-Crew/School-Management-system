package schema

import "time"

type Transfer struct {
	ID            int64  `json:"id"`
	StudentID     int64  `json:"student_id"`
	FromSchoolID  int64  `json:"from_school"`
	ToSchoolID    int64  `json:"to_school"`
	Status        string `json:"status"`
	DateInitiated string `json:"date_initiated"`
	DateAccepted  string `json:"date_accepted,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

type CreateTransferRequest struct {
	StudentID     int64     `json:"student_id" validate:"required"`
	FromSchoolID  int64     `json:"from_school" validate:"required"`
	ToSchoolID    int64     `json:"to_school" validate:"required"`
	DateInitiated time.Time `json:"date_initiated" time_format:"2006-01-02"`
	Reason        string    `json:"reason,omitempty"`
}

type GetIncomingTransfersRequest struct {
	ToSchoolID int64 `json:"to_school_id" validate:"required"`
}