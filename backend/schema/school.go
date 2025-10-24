package schema

type School struct{
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	DistrictID int64  `json:"district_id"`
	SchoolNumber string  `json:"school_number"`
}
type GetSchoolListRequest struct {
	IDs        []int64 `json:"ids"`
	Name       string  `json:"name"`
	DistrictID int64   `json:"district_id"`
	SchoolNumber string  `json:"school_number"`
}
type CreateSchoolRequest struct {
	Name       string `json:"name"`
	DistrictID int64  `json:"district_id"`
	SchoolNumber string  `json:"school_number"`
}
type UpdateSchoolRequest struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	DistrictID int64  `json:"district_id"`
	SchoolNumber string  `json:"school_number"`
}
