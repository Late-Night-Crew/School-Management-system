package schema

type AcademicYear struct {
	ID        int64  `json:"id"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`  
	Year      int    `json:"year"`
	Status    string `json:"status"`
}

type GetAcademicYearListRequest struct {
	IDs       []int64 `json:"ids"`
	StartDate string  `json:"start_date"`
	Year      int     `json:"year"`
	EndDate   string  `json:"end_date"`  
	Status    string  `json:"status"`
}

type CreateAcademicYearRequest struct {
	Year      int    `json:"year"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`  
	Status    string `json:"status"`
}

type UpdateAcademicYearRequest struct {
	ID        int64  `json:"id"`
	Year      int    `json:"year"`
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`  
	Status    string `json:"status"`
}
