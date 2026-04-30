package services

import (
	"context"
	"database/sql"
	"fmt"
	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type SchoolAdminService interface {
	GetDashboardStats(ctx context.Context, schoolID int64) (*schema.SchoolDashboardStats, error)
	GetStudentsBySchoolID(ctx context.Context, schoolID int64) ([]*schema.Student, error)
	GetStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) (*schema.Student, error)
	CreateStudentForSchool(ctx context.Context, schoolID int64, req *schema.CreateStudentRequest) (*schema.Student, error)
	UpdateStudentForSchool(ctx context.Context, schoolID int64, req *schema.UpdateStudentRequest) (*schema.Student, error)
	DeleteStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) error
	ListExamResultsBySchoolID(ctx context.Context, schoolID int64) ([]*schema.ExamResult, error)
	GetExamResultBySchoolIDAndYear(ctx context.Context, schoolID int64, academicYearID int64) (*schema.ExamResult, error)
	CreateExamResult(ctx context.Context, schoolID int64, req *schema.CreateExamResultRequest) (*schema.ExamResult, error)
	UpdateExamResult(ctx context.Context, schoolID int64, examResultID int64, req *schema.UpdateExamResultRequest) (*schema.ExamResult, error)
}

type schoolAdminService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewSchoolAdminService(queries *dbsqlc.Queries, logger logging.Logger) SchoolAdminService {
	return &schoolAdminService{
		queries: queries,
		logger:  logger,
	}
}

func (s *schoolAdminService) GetDashboardStats(ctx context.Context, schoolID int64) (*schema.SchoolDashboardStats, error) {
	stats, err := s.queries.GetSchoolDashboardStats(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve dashboard stats for school %d: %w", schoolID, err)
	}
	return &schema.SchoolDashboardStats{
		StudentCount:          stats.StudentCount,
		IncomingTransferCount: stats.IncomingTransferCount,
		OutgoingTransferCount: stats.OutgoingTransferCount,
		ExamResultCount:       stats.ExamResultCount,
	}, nil
}

func mapDBStudent(dbStudent dbsqlc.GetStudentsBySchoolIDRow) *schema.Student {
	dateOfBirth := ""
	if dbStudent.DateOfBirth.Valid {
		dateOfBirth = dbStudent.DateOfBirth.Time.Format("2006-01-02")
	}
	status := ""
	if dbStudent.Status.Valid {
		status = dbStudent.Status.String
	}
	gender := ""
	if dbStudent.Gender.Valid {
		gender = dbStudent.Gender.String
	}
	guardianName := ""
	if dbStudent.GuardianName.Valid {
		guardianName = dbStudent.GuardianName.String
	}
	previousSchool := ""
	if dbStudent.PreviousSchool.Valid {
		previousSchool = dbStudent.PreviousSchool.String
	}

	academicYearID := int64(0)
	if dbStudent.AcademicYearID.Valid {
		academicYearID = int64(dbStudent.AcademicYearID.Int32)
	}

	return &schema.Student{
		ID:             int64(dbStudent.ID),
		StudentNumber:  dbStudent.StudentNumber,
		FirstName:      dbStudent.FirstName,
		LastName:       dbStudent.LastName,
		DateOfBirth:    dateOfBirth,
		Gender:         gender,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		GuardianName:   guardianName,
		PreviousSchool: previousSchool,
		SchoolID:       int64(dbStudent.SchoolID),
		AcademicYearID: academicYearID,
		Status:         status,
	}
}

func mapDBExamResult(dbResult dbsqlc.ExamResult) *schema.ExamResult {
	return &schema.ExamResult{
		ID:             int64(dbResult.ID),
		SchoolID:       int64(dbResult.SchoolID),
		AcademicYearID: int64(dbResult.AcademicYearID),
		JcePassRate:    dbResult.JcePassRate.String,
		MscePassRate:   dbResult.MscePassRate.String,
	}
}

func (s *schoolAdminService) GetStudentsBySchoolID(ctx context.Context, schoolID int64) ([]*schema.Student, error) {
	dbStudents, err := s.queries.GetStudentsBySchoolID(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to list students for school %d: %w", schoolID, err)
	}
	out := make([]*schema.Student, 0, len(dbStudents))
	for _, student := range dbStudents {
		out = append(out, mapDBStudent(student))
	}
	return out, nil
}

func (s *schoolAdminService) GetStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) (*schema.Student, error) {
	dbStudent, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{ID: int32(studentID), SchoolID: int32(schoolID)})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to fetch student %d for school %d: %w", studentID, schoolID, err)
	}
	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:         dbStudent.Gender.String,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		GuardianName:   dbStudent.GuardianName.String,
		PreviousSchool: dbStudent.PreviousSchool.String,
		SchoolID:       int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Status: dbStudent.Status.String,
	}, nil
}

func (s *schoolAdminService) CreateStudentForSchool(ctx context.Context, schoolID int64, req *schema.CreateStudentRequest) (*schema.Student, error) {
	dbStudent, err := s.queries.CreateStudent(ctx, dbsqlc.CreateStudentParams{
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		StudentNumber:  req.StudentNumber,
		FormLevel:      sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		SchoolID:       int32(schoolID),
		DateOfBirth:    common.StringToNullTime(req.DateOfBirth),
		AcademicYearID: sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: true},
		Status:         sql.NullString{String: req.Status, Valid: req.Status != ""},
		GuardianName:   sql.NullString{String: req.GuardianName, Valid: req.GuardianName != ""},
		Gender:         sql.NullString{String: req.Gender, Valid: req.Gender != ""},
		PreviousSchool: sql.NullString{String: req.PreviousSchool, Valid: req.PreviousSchool != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create student for school %d: %w", schoolID, err)
	}
	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:         dbStudent.Gender.String,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		GuardianName:   dbStudent.GuardianName.String,
		PreviousSchool: dbStudent.PreviousSchool.String,
		SchoolID:       int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Status: dbStudent.Status.String,
	}, nil
}

func (s *schoolAdminService) UpdateStudentForSchool(ctx context.Context, schoolID int64, req *schema.UpdateStudentRequest) (*schema.Student, error) {
	dbStudent, err := s.queries.UpdateStudentByIDAndSchoolID(ctx, dbsqlc.UpdateStudentByIDAndSchoolIDParams{
		ID:             int32(req.ID),
		StudentNumber:  req.StudentNumber,
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		DateOfBirth:    common.StringToNullTime(req.DateOfBirth),
		Gender:         sql.NullString{String: req.Gender, Valid: req.Gender != ""},
		FormLevel:      sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		GuardianName:   sql.NullString{String: req.GuardianName, Valid: req.GuardianName != ""},
		PreviousSchool: sql.NullString{String: req.PreviousSchool, Valid: req.PreviousSchool != ""},
		SchoolID:       int32(schoolID),
		AcademicYearID: sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: true},
		Status:         sql.NullString{String: req.Status, Valid: req.Status != ""},
		SchoolID_2:     int32(schoolID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update student %d for school %d: %w", req.ID, schoolID, err)
	}
	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:         dbStudent.Gender.String,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		GuardianName:   dbStudent.GuardianName.String,
		PreviousSchool: dbStudent.PreviousSchool.String,
		SchoolID:       int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Status: dbStudent.Status.String,
	}, nil
}

func (s *schoolAdminService) DeleteStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) error {
	return s.queries.DeleteStudentByIDAndSchoolID(ctx, dbsqlc.DeleteStudentByIDAndSchoolIDParams{ID: int32(studentID), SchoolID: int32(schoolID)})
}

func (s *schoolAdminService) ListExamResultsBySchoolID(ctx context.Context, schoolID int64) ([]*schema.ExamResult, error) {
	dbResults, err := s.queries.ListExamResultsBySchoolID(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to list exam results for school %d: %w", schoolID, err)
	}
	out := make([]*schema.ExamResult, 0, len(dbResults))
	for _, exam := range dbResults {
		out = append(out, mapDBExamResult(exam))
	}
	return out, nil
}

func (s *schoolAdminService) GetExamResultBySchoolIDAndYear(ctx context.Context, schoolID int64, academicYearID int64) (*schema.ExamResult, error) {
	dbExam, err := s.queries.GetExamResultBySchoolIDAndAcademicYear(ctx, dbsqlc.GetExamResultBySchoolIDAndAcademicYearParams{
		SchoolID:       int32(schoolID),
		AcademicYearID: int32(academicYearID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get exam result for school %d and year %d: %w", schoolID, academicYearID, err)
	}
	return mapDBExamResult(dbExam), nil
}

func (s *schoolAdminService) CreateExamResult(ctx context.Context, schoolID int64, req *schema.CreateExamResultRequest) (*schema.ExamResult, error) {
	dbExam, err := s.queries.CreateExamResult(ctx, dbsqlc.CreateExamResultParams{
		SchoolID:       int32(schoolID),
		AcademicYearID: int32(req.AcademicYearID),
		JcePassRate:    sql.NullString{String: req.JcePassRate, Valid: req.JcePassRate != ""},
		MscePassRate:   sql.NullString{String: req.MscePassRate, Valid: req.MscePassRate != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create exam result for school %d: %w", schoolID, err)
	}
	return mapDBExamResult(dbExam), nil
}

func (s *schoolAdminService) UpdateExamResult(ctx context.Context, schoolID int64, examResultID int64, req *schema.UpdateExamResultRequest) (*schema.ExamResult, error) {
	dbResults, err := s.queries.ListExamResultsBySchoolID(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to verify exam result ownership for school %d: %w", schoolID, err)
	}
	found := false
	for _, exam := range dbResults {
		if exam.ID == int32(examResultID) {
			found = true
			break
		}
	}
	if !found {
		return nil, fmt.Errorf("exam result %d not found for school %d", examResultID, schoolID)
	}

	dbExam, err := s.queries.UpdateExamResult(ctx, dbsqlc.UpdateExamResultParams{
		ID:           int32(examResultID),
		JcePassRate:  sql.NullString{String: req.JcePassRate, Valid: req.JcePassRate != ""},
		MscePassRate: sql.NullString{String: req.MscePassRate, Valid: req.MscePassRate != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update exam result %d for school %d: %w", examResultID, schoolID, err)
	}
	return mapDBExamResult(dbExam), nil
}
