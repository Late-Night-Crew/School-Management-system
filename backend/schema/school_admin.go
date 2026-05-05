package schema

type SchoolDashboardStats struct {
	StudentCount          int64 `json:"student_count"`
	IncomingTransferCount int64 `json:"incoming_transfer_count"`
	OutgoingTransferCount int64 `json:"outgoing_transfer_count"`
	ExamResultCount       int64 `json:"exam_result_count"`
}

type ExamResult struct {
	ID             int64  `json:"id"`
	SchoolID       int64  `json:"school_id"`
	AcademicYearID int64  `json:"academic_year_id"`
	JcePassRate    string `json:"jce_pass_rate"`
	MscePassRate   string `json:"msce_pass_rate"`
}

type CreateExamResultRequest struct {
	AcademicYearID int64  `json:"academic_year_id" validate:"required"`
	JcePassRate    string `json:"jce_pass_rate"`
	MscePassRate   string `json:"msce_pass_rate"`
}

type UpdateExamResultRequest struct {
	JcePassRate  string `json:"jce_pass_rate"`
	MscePassRate string `json:"msce_pass_rate"`
}
