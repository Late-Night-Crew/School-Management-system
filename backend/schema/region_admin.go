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
