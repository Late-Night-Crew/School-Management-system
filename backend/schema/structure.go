package schema

// What still depends on a school, district or division. The screens show these before
// a delete, move or close so the admin knows what the action affects.

type SchoolUsage struct {
	Students                    int `json:"students"`
	Marks                       int `json:"marks"`
	Transfers                   int `json:"transfers"`
	UnfinishedIncomingTransfers int `json:"unfinished_incoming_transfers"`
	// StudentsWithPendingTransfers are left out of a whole-school transfer
	StudentsWithPendingTransfers int  `json:"students_with_pending_transfers"`
	ExamResults                  int  `json:"exam_results"`
	ActiveAccounts               int  `json:"active_accounts"`
	Closed                       bool `json:"closed"`
	// CanDelete is true when nothing would be lost by deleting the school
	CanDelete bool `json:"can_delete"`
}

type DistrictUsage struct {
	Schools        int  `json:"schools"`
	ActiveAccounts int  `json:"active_accounts"`
	CanDelete      bool `json:"can_delete"`
}

type RegionUsage struct {
	Districts      int  `json:"districts"`
	Schools        int  `json:"schools"`
	ActiveAccounts int  `json:"active_accounts"`
	CanDelete      bool `json:"can_delete"`
}

// MoveSchoolsRequest moves every school in a district to another district.
type MoveSchoolsRequest struct {
	ToDistrictID int64 `json:"to_district_id" validate:"required,min=1"`
}

// MoveDistrictsRequest moves every district in a division to another division.
type MoveDistrictsRequest struct {
	ToRegionID int64 `json:"to_region_id" validate:"required,min=1"`
}

type MoveResult struct {
	Moved int `json:"moved"`
}

type CloseSchoolRequest struct {
	Note string `json:"note" validate:"max=500"`
}

type CloseSchoolResult struct {
	AccountsDeactivated int `json:"accounts_deactivated"`
}

// TransferAllStudentsRequest moves every student of a school to another school.
type TransferAllStudentsRequest struct {
	ToSchoolID int64  `json:"to_school_id" validate:"required,min=1"`
	Reason     string `json:"reason" validate:"required,max=500"`
}

// TransferAllStudentsResult: Skipped students had a pending transfer of their own.
type TransferAllStudentsResult struct {
	Transferred int `json:"transferred"`
	Skipped     int `json:"skipped"`
}
