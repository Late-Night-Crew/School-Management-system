package schema

// SchoolReportFilter narrows the school report. Zero values mean "no filter";
// AcademicYearID selects which year's exam results are reported.
type SchoolReportFilter struct {
	RegionID       int64
	DistrictID     int64
	AcademicYearID int64
}

// SchoolReportRow is one school's line in the admin school report.
// Pass rates are nil when the school has no exam result for the selected year.
type SchoolReportRow struct {
	SchoolID        int64    `json:"school_id"`
	SchoolName      string   `json:"school_name"`
	SchoolNumber    string   `json:"school_number"`
	DistrictID      int64    `json:"district_id"`
	DistrictName    string   `json:"district_name"`
	RegionID        int64    `json:"region_id"`
	RegionName      string   `json:"region_name"`
	StudentCount    int64    `json:"student_count"`
	MaleCount       int64    `json:"male_count"`
	FemaleCount     int64    `json:"female_count"`
	DisabilityCount int64    `json:"disability_count"`
	TransfersIn     int64    `json:"transfers_in"`
	TransfersOut    int64    `json:"transfers_out"`
	PendingIn       int64    `json:"pending_in"`
	JcePassRate     *float64 `json:"jce_pass_rate"`
	MscePassRate    *float64 `json:"msce_pass_rate"`
	// PassRateSource says where the JCE/MSCE rates come from (empty when there are none)
	PassRateSource string `json:"pass_rate_source,omitempty"`
}

// Where exam pass rates come from: calculated from Term 3 marks (the exam results), or
// recorded by hand before term reports existed.
const (
	PassRateCalculated = "calculated"
	PassRateRecorded   = "recorded"
)
