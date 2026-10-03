package schema

import "time"

// Transfer statuses. A transfer moves Pending -> Accepted -> Completed,
// or Pending -> Rejected.
const (
	TransferStatusPending   = "Pending"
	TransferStatusAccepted  = "Accepted"
	TransferStatusRejected  = "Rejected"
	TransferStatusCompleted = "Completed"
)

type Transfer struct {
	ID              int64  `json:"id"`
	StudentID       int64  `json:"student_id"`
	StudentNumber   string `json:"student_number"`
	StudentName     string `json:"student_name"`
	FromSchoolID    int64  `json:"from_school"`
	FromSchoolName  string `json:"from_school_name"`
	ToSchoolID      int64  `json:"to_school"`
	ToSchoolName    string `json:"to_school_name"`
	Status          string `json:"status"`
	DateInitiated   string `json:"date_initiated"`
	DateAccepted    string `json:"date_accepted,omitempty"`
	Reason          string `json:"reason,omitempty"`
	RejectionReason string `json:"rejection_reason,omitempty"`
}

type CreateTransferRequest struct {
	StudentID     int64     `json:"student_id" validate:"required"`
	FromSchoolID  int64     `json:"from_school" validate:"required"`
	ToSchoolID    int64     `json:"to_school" validate:"required"`
	DateInitiated time.Time `json:"date_initiated"`
	Reason        string    `json:"reason,omitempty"`
}

type RejectRequest struct {
	Reason string `json:"reason" validate:"required"`
}
