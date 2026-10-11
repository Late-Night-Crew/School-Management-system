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

// ApproveRequest is the super admin's approval. The note is required because the
// super admin is approving on the receiving school's behalf.
type ApproveRequest struct {
	Note string `json:"note" validate:"required"`
}

// FinalizeRequest is the super admin's finalization, with an optional note.
type FinalizeRequest struct {
	Note string `json:"note,omitempty"`
}

// Transfer audit actions, in the order they normally happen.
const (
	TransferActionCreated   = "Created"
	TransferActionApproved  = "Approved"
	TransferActionRejected  = "Rejected"
	TransferActionCompleted = "Completed"
	TransferActionExported  = "Exported"
)

// TransferHistoryFilter narrows the super admin's transfer history. Every field is
// optional; DateFrom and DateTo are inclusive "YYYY-MM-DD" days on the initiated date.
type TransferHistoryFilter struct {
	Status     string `query:"status" validate:"omitempty,oneof=Pending Accepted Rejected Completed"`
	RegionID   int64  `query:"region_id" validate:"omitempty,min=1"`
	DistrictID int64  `query:"district_id" validate:"omitempty,min=1"`
	SchoolID   int64  `query:"school_id" validate:"omitempty,min=1"`
	DateFrom   string `query:"date_from" validate:"omitempty,datetime=2006-01-02"`
	DateTo     string `query:"date_to" validate:"omitempty,datetime=2006-01-02"`
	Search     string `query:"search"`
	Page       int    `query:"page" validate:"omitempty,min=1"`
	PageSize   int    `query:"page_size" validate:"omitempty,min=1,max=200"`
}

// TransferAction is one audit entry: who did what to a transfer, and when.
// ActorName is empty when the actor was not recorded (actions from before audit
// logging was enabled).
type TransferAction struct {
	Action    string `json:"action"`
	ActorName string `json:"actor_name,omitempty"`
	ActorRole string `json:"actor_role,omitempty"`
	Note      string `json:"note,omitempty"`
	At        string `json:"at"`
}

// TransferAuditEntry is a TransferAction in a transfer's timeline.
type TransferAuditEntry struct {
	ID int64 `json:"id"`
	TransferAction
	ActorSchoolName string `json:"actor_school_name,omitempty"`
}

// TransferHistoryItem is a transfer as listed in the super admin's history, with
// where both schools are and who made the decisions on it.
type TransferHistoryItem struct {
	Transfer
	FromDistrictName string          `json:"from_district_name"`
	FromRegionName   string          `json:"from_region_name"`
	ToDistrictName   string          `json:"to_district_name"`
	ToRegionName     string          `json:"to_region_name"`
	Decision         *TransferAction `json:"decision,omitempty"`
	Completion       *TransferAction `json:"completion,omitempty"`
}

// TransferHistoryPage is one page of the history plus totals for the same filters.
// StatusCounts ignores the status filter so every status tab can show its count.
type TransferHistoryPage struct {
	Items        []*TransferHistoryItem `json:"items"`
	Total        int64                  `json:"total"`
	Page         int                    `json:"page"`
	PageSize     int                    `json:"page_size"`
	StatusCounts map[string]int64       `json:"status_counts"`
}
