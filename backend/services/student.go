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

type StudentService interface {
	GetStudentList(ctx context.Context, req *schema.GetStudentListRequest) ([]*schema.Student, error)
	GetStudentByID(ctx context.Context, studentID int64) (*schema.Student, error)
	CreateStudent(ctx context.Context, req *schema.CreateStudentRequest) (*schema.Student, error)
	UpdateStudent(ctx context.Context, req *schema.UpdateStudentRequest) (*schema.Student, error)
	DeleteStudent(ctx context.Context, studentID int64) error
}

type studentService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewStudentService(queries *dbsqlc.Queries, logger logging.Logger) StudentService {
	return &studentService{
		queries: queries,
		logger:  logger,
	}
}

func (s *studentService) GetStudentList(ctx context.Context, req *schema.GetStudentListRequest) ([]*schema.Student, error) {
	res := make([]*schema.Student, 0)
	dbStudents, err := s.queries.ListStudents(ctx, dbsqlc.ListStudentsParams{Limit: 100, Offset: 0})
	if err != nil {
		return nil, fmt.Errorf("failed to list students: %w", err)
	}

	for _, dbStudent := range dbStudents {
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

		res = append(res, &schema.Student{
			ID:             int64(dbStudent.ID),
			FirstName:      dbStudent.FirstName,
			LastName:       dbStudent.LastName,
			FormLevel:      int(dbStudent.FormLevel.Int32),
			StudentNumber:  dbStudent.StudentNumber,
			SchoolID:       int64(dbStudent.SchoolID),
			DateOfBirth:    dateOfBirth,
			AcademicYearID: int64(dbStudent.AcademicYearID.Int32),
			Status:         status,
			Gender:         gender,
			GuardianName:   guardianName,
			PreviousSchool: previousSchool,
		})
	}
	return res, nil
}

func (s *studentService) GetStudentByID(ctx context.Context, studentID int64) (*schema.Student, error) {
	student, err := s.queries.GetStudentByID(ctx, int32(studentID))
	if err != nil {
		return nil, fmt.Errorf("failed to get student by ID: %w", err)
	}

	dateOfBirth := ""
	if student.DateOfBirth.Valid {
		dateOfBirth = student.DateOfBirth.Time.Format("2006-01-02")
	}

	status := ""
	if student.Status.Valid {
		status = student.Status.String
	}

	gender := ""
	if student.Gender.Valid {
		gender = student.Gender.String
	}

	guardianName := ""
	if student.GuardianName.Valid {
		guardianName = student.GuardianName.String
	}

	previousSchool := ""
	if student.PreviousSchool.Valid {
		previousSchool = student.PreviousSchool.String
	}

	return &schema.Student{
		ID:             int64(student.ID),
		FirstName:      student.FirstName,
		LastName:       student.LastName,
		FormLevel:      int(student.FormLevel.Int32),
		StudentNumber:  student.StudentNumber,
		SchoolID:       int64(student.SchoolID),
		DateOfBirth:    dateOfBirth,
		AcademicYearID: int64(student.AcademicYearID.Int32),
		Status:         status,
		Gender:         gender,
		GuardianName:   guardianName,
		PreviousSchool: previousSchool,
	}, nil
}

func (s *studentService) CreateStudent(ctx context.Context, req *schema.CreateStudentRequest) (*schema.Student, error) {
	dbStudent, err := s.queries.CreateStudent(ctx, dbsqlc.CreateStudentParams{
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		StudentNumber:  req.StudentNumber,
		FormLevel:      sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		SchoolID:       int32(req.SchoolID),
		DateOfBirth:    common.StringToNullTime(req.DateOfBirth),
		AcademicYearID: sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: true},
		Status:         sql.NullString{String: req.Status, Valid: true},
		GuardianName:   sql.NullString{String: req.GuardianName, Valid: true},
		Gender:         sql.NullString{String: req.Gender, Valid: true},
		PreviousSchool: sql.NullString{String: req.PreviousSchool, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create student: %w", err)
	}

	dateOfBirth := ""
	if dbStudent.DateOfBirth.Valid {
		dateOfBirth = dbStudent.DateOfBirth.Time.Format("2006-01-02")
	}

	return &schema.Student{
		ID:             int64(dbStudent.ID),
		FirstName:      dbStudent.FirstName,
		LastName:       dbStudent.LastName,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		StudentNumber:  dbStudent.StudentNumber,
		SchoolID:       int64(dbStudent.SchoolID),
		DateOfBirth:    dateOfBirth,
		AcademicYearID: int64(dbStudent.AcademicYearID.Int32),
		Status:         dbStudent.Status.String,
		Gender:         dbStudent.Gender.String,
		GuardianName:   dbStudent.GuardianName.String,
		PreviousSchool: dbStudent.PreviousSchool.String,
	}, nil
}

func (s *studentService) UpdateStudent(ctx context.Context, req *schema.UpdateStudentRequest) (*schema.Student, error) {
	dbStudent, err := s.queries.UpdateStudent(ctx, dbsqlc.UpdateStudentParams{
		ID:             int32(req.ID),
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		StudentNumber:  req.StudentNumber,
		FormLevel:      sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		SchoolID:       int32(req.SchoolID),
		DateOfBirth:    common.StringToNullTime(req.DateOfBirth),
		AcademicYearID: sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: true},
		Status:         sql.NullString{String: req.Status, Valid: true},
		GuardianName:   sql.NullString{String: req.GuardianName, Valid: true},
		Gender:         sql.NullString{String: req.Gender, Valid: true},
		PreviousSchool: sql.NullString{String: req.PreviousSchool, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update student: %w", err)
	}

	dateOfBirth := ""
	if dbStudent.DateOfBirth.Valid {
		dateOfBirth = dbStudent.DateOfBirth.Time.Format("2006-01-02")
	}

	return &schema.Student{
		ID:             int64(dbStudent.ID),
		FirstName:      dbStudent.FirstName,
		LastName:       dbStudent.LastName,
		FormLevel:      int(dbStudent.FormLevel.Int32),
		StudentNumber:  dbStudent.StudentNumber,
		SchoolID:       int64(dbStudent.SchoolID),
		DateOfBirth:    dateOfBirth,
		AcademicYearID: int64(dbStudent.AcademicYearID.Int32),
		Status:         dbStudent.Status.String,
		Gender:         dbStudent.Gender.String,
		GuardianName:   dbStudent.GuardianName.String,
		PreviousSchool: dbStudent.PreviousSchool.String,
	}, nil
}

func (s *studentService) DeleteStudent(ctx context.Context, studentID int64) error {
	err := s.queries.DeleteStudent(ctx, int32(studentID))
	if err != nil {
		return fmt.Errorf("failed to delete student: %w", err)
	}
	return nil
}
