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
	// Terms: when each of the three terms starts and ends (required; schools cannot
	// move on before their term ends, and reminders are sent from these dates)
	Terms []TermDatesInput `json:"terms" validate:"required,len=3,dive"`
}

// UpdateAcademicYearRequest changes a year's dates and, when Terms is given, its three
// terms' dates in the same save (so a whole year can be moved at once).
type UpdateAcademicYearRequest struct {
	ID        int64            `json:"id"`
	Year      int              `json:"year" validate:"required,min=2000,max=2100"`
	StartDate string           `json:"start_date" validate:"required,datetime=2006-01-02"`
	EndDate   string           `json:"end_date" validate:"required,datetime=2006-01-02"`
	Status    string           `json:"status"`
	Terms     []TermDatesInput `json:"terms" validate:"omitempty,len=3,dive"`
}
