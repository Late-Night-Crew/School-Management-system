package schema

type District struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	RegionID int64  `json:"region_id"`
}
type GetDistrictListRequest struct {
	IDs      []int64 `json:"ids"`
	Name     string  `json:"name"`
	RegionID int64   `json:"region_id"`
}

type CreateDistrictRequest struct {
	Name     string `json:"name"`
	RegionID int64  `json:"region_id"`
}

type UpdateDistrictRequest struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	RegionID int64  `json:"region_id"`
}
