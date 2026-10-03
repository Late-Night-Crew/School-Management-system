package schema

// RegionDashboardStats are the headline counts for a regional admin.
type RegionDashboardStats struct {
	DistrictCount        int64 `json:"district_count"`
	SchoolCount          int64 `json:"school_count"`
	StudentCount         int64 `json:"student_count"`
	MaleCount            int64 `json:"male_count"`
	FemaleCount          int64 `json:"female_count"`
	DisabilityCount      int64 `json:"disability_count"`
	PendingTransferCount int64 `json:"pending_transfer_count"`
}

// RegionDistrictSummary is a district in a region with its school and student counts.
type RegionDistrictSummary struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	SchoolCount  int64  `json:"school_count"`
	StudentCount int64  `json:"student_count"`
}

// RegionStudentFilter narrows a region's student list. Zero values mean "no filter".
type RegionStudentFilter struct {
	DistrictID int64
	SchoolID   int64
}

// RegionStudent is a read-only student row for regional oversight.
type RegionStudent struct {
	ID            int64  `json:"id"`
	StudentNumber string `json:"student_number"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Gender        string `json:"gender"`
	FormLevel     int    `json:"form_level"`
	Status        string `json:"status"`
	SchoolID      int64  `json:"school_id"`
	SchoolName    string `json:"school_name"`
	DistrictID    int64  `json:"district_id"`
	DistrictName  string `json:"district_name"`
}
