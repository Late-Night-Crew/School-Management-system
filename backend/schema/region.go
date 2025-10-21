package schema

type Region struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}
type GetRegionListRequest struct {
	IDs  []int64 `json:"ids"`
	Name string  `json:"name"`
}

type CreateRegionRequest struct {
	Name string `json:"name"`
}

type UpdateRegionRequest struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}