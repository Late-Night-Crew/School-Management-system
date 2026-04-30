package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

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

	studentIDs := make([]int32, 0, len(dbStudents))
	for _, student := range dbStudents {
		studentIDs = append(studentIDs, int32(student.ID))
	}

	subjectIDsByStudent, err := s.loadStudentSubjectIDs(ctx, studentIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to load student subjects: %w", err)
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

		guardianPhone := ""
		if dbStudent.GuardianPhone.Valid {
			guardianPhone = dbStudent.GuardianPhone.String
		}

		guardianAltPhone := ""
		if dbStudent.GuardianAltPhone.Valid {
			guardianAltPhone = dbStudent.GuardianAltPhone.String
		}

		guardianEmail := ""
		if dbStudent.GuardianEmail.Valid {
			guardianEmail = dbStudent.GuardianEmail.String
		}

		guardianRelationship := ""
		if dbStudent.GuardianRelationship.Valid {
			guardianRelationship = dbStudent.GuardianRelationship.String
		}

		previousSchool := ""
		if dbStudent.PreviousSchool.Valid {
			previousSchool = dbStudent.PreviousSchool.String
		}

		disabilityDetails := ""
		if dbStudent.DisabilityDetails.Valid {
			disabilityDetails = dbStudent.DisabilityDetails.String
		}

		subjectIDs := subjectIDsByStudent[int32(dbStudent.ID)]

		res = append(res, &schema.Student{
			ID:                   int64(dbStudent.ID),
			StudentNumber:        dbStudent.StudentNumber,
			FirstName:            dbStudent.FirstName,
			MiddleName:           dbStudent.MiddleName.String,
			LastName:             dbStudent.LastName,
			FormLevel:            int(dbStudent.FormLevel.Int32),
			SchoolID:             int64(dbStudent.SchoolID),
			DateOfBirth:          dateOfBirth,
			AcademicYearID:       int64(dbStudent.AcademicYearID.Int32),
			Status:               status,
			Gender:               gender,
			GuardianName:         guardianName,
			GuardianPhone:        guardianPhone,
			GuardianAltPhone:     guardianAltPhone,
			GuardianEmail:        guardianEmail,
			GuardianRelationship: guardianRelationship,
			PreviousSchool:       previousSchool,
			PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
			Disability:           dbStudent.Disability.Bool,
			DisabilityDetails:    disabilityDetails,
			SubjectIDs:           subjectIDs,
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

	guardianPhone := ""
	if student.GuardianPhone.Valid {
		guardianPhone = student.GuardianPhone.String
	}

	guardianAltPhone := ""
	if student.GuardianAltPhone.Valid {
		guardianAltPhone = student.GuardianAltPhone.String
	}

	guardianEmail := ""
	if student.GuardianEmail.Valid {
		guardianEmail = student.GuardianEmail.String
	}

	guardianRelationship := ""
	if student.GuardianRelationship.Valid {
		guardianRelationship = student.GuardianRelationship.String
	}

	previousSchool := ""
	if student.PreviousSchool.Valid {
		previousSchool = student.PreviousSchool.String
	}

	disabilityDetails := ""
	if student.DisabilityDetails.Valid {
		disabilityDetails = student.DisabilityDetails.String
	}

	subjectIDsByStudent, err := s.loadStudentSubjectIDs(ctx, []int32{int32(student.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to load student subjects: %w", err)
	}

	return &schema.Student{
		ID:                   int64(student.ID),
		StudentNumber:        student.StudentNumber,
		FirstName:            student.FirstName,
		MiddleName:           student.MiddleName.String,
		LastName:             student.LastName,
		FormLevel:            int(student.FormLevel.Int32),
		SchoolID:             int64(student.SchoolID),
		DateOfBirth:          dateOfBirth,
		AcademicYearID:       int64(student.AcademicYearID.Int32),
		Status:               status,
		Gender:               gender,
		GuardianName:         guardianName,
		GuardianPhone:        guardianPhone,
		GuardianAltPhone:     guardianAltPhone,
		GuardianEmail:        guardianEmail,
		GuardianRelationship: guardianRelationship,
		PreviousSchool:       previousSchool,
		PreviousSchoolID:     int64(student.PreviousSchoolID.Int32),
		Disability:           student.Disability.Bool,
		DisabilityDetails:    disabilityDetails,
		SubjectIDs:           subjectIDsByStudent[int32(student.ID)],
	}, nil
}

func (s *studentService) createStudentSubjectAssignments(ctx context.Context, studentID int32, subjectIDs []int64) error {
	if len(subjectIDs) == 0 {
		return nil
	}

	for _, subjectID := range subjectIDs {
		if err := s.queries.CreateStudentSubjectAssignment(ctx, dbsqlc.CreateStudentSubjectAssignmentParams{
			StudentID: int32(studentID),
			SubjectID: int32(subjectID),
		}); err != nil {
			return err
		}
	}

	return nil
}

func (s *studentService) loadStudentSubjectIDs(ctx context.Context, studentIDs []int32) (map[int32][]int64, error) {
	subjectIDsByStudent := make(map[int32][]int64)
	if len(studentIDs) == 0 {
		return subjectIDsByStudent, nil
	}

	for _, id := range studentIDs {
		dbRows, err := s.queries.ListStudentSubjectIDsByStudentID(ctx, id)
		if err != nil {
			return nil, err
		}
		for _, row := range dbRows {
			subjectIDsByStudent[row.StudentID] = append(subjectIDsByStudent[row.StudentID], int64(row.SubjectID))
		}
	}

	return subjectIDsByStudent, nil
}

func (s *studentService) CreateStudent(ctx context.Context, req *schema.CreateStudentRequest) (*schema.Student, error) {
	guardianName := req.GuardianName
	if guardianName == "" {
		guardianName = strings.TrimSpace(req.GuardianFirstname + " " + req.GuardianLastname)
	}

	dbStudent, err := s.queries.CreateStudent(ctx, dbsqlc.CreateStudentParams{
		StudentNumber:        req.StudentNumber,
		FirstName:            req.FirstName,
		MiddleName:           sql.NullString{String: req.MiddleName, Valid: req.MiddleName != ""},
		LastName:             req.LastName,
		DateOfBirth:          common.StringToNullTime(req.DateOfBirth),
		Gender:               sql.NullString{String: req.Gender, Valid: req.Gender != ""},
		FormLevel:            sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		GuardianName:         sql.NullString{String: guardianName, Valid: guardianName != ""},
		GuardianPhone:        sql.NullString{String: req.GuardianPhone, Valid: req.GuardianPhone != ""},
		GuardianAltPhone:     sql.NullString{String: req.GuardianAltPhone, Valid: req.GuardianAltPhone != ""},
		GuardianEmail:        sql.NullString{String: req.GuardianEmail, Valid: req.GuardianEmail != ""},
		GuardianRelationship: sql.NullString{String: req.GuardianRelationship, Valid: req.GuardianRelationship != ""},
		PreviousSchool:       sql.NullString{String: req.PreviousSchool, Valid: req.PreviousSchool != ""},
		PreviousSchoolID:     sql.NullInt32{Int32: int32(req.PreviousSchoolID), Valid: req.PreviousSchoolID != 0},
		SchoolID:             int32(req.SchoolID),
		AcademicYearID:       sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: req.AcademicYearID != 0},
		Disability:           sql.NullBool{Bool: req.Disability, Valid: true},
		DisabilityDetails:    sql.NullString{String: req.DisabilityDetails, Valid: req.DisabilityDetails != ""},
		Status:               sql.NullString{String: req.Status, Valid: req.Status != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create student: %w", err)
	}

	if err := s.createStudentSubjectAssignments(ctx, dbStudent.ID, req.SubjectIDs); err != nil {
		return nil, fmt.Errorf("failed to assign student subjects: %w", err)
	}

	dateOfBirth := ""
	if dbStudent.DateOfBirth.Valid {
		dateOfBirth = dbStudent.DateOfBirth.Time.Format("2006-01-02")
	}

	return &schema.Student{
		ID:                   int64(dbStudent.ID),
		StudentNumber:        dbStudent.StudentNumber,
		FirstName:            dbStudent.FirstName,
		MiddleName:           dbStudent.MiddleName.String,
		LastName:             dbStudent.LastName,
		FormLevel:            int(dbStudent.FormLevel.Int32),
		SchoolID:             int64(dbStudent.SchoolID),
		DateOfBirth:          dateOfBirth,
		AcademicYearID:       int64(dbStudent.AcademicYearID.Int32),
		Status:               dbStudent.Status.String,
		Gender:               dbStudent.Gender.String,
		GuardianName:         dbStudent.GuardianName.String,
		GuardianPhone:        dbStudent.GuardianPhone.String,
		GuardianAltPhone:     dbStudent.GuardianAltPhone.String,
		GuardianEmail:        dbStudent.GuardianEmail.String,
		GuardianRelationship: dbStudent.GuardianRelationship.String,
		PreviousSchool:       dbStudent.PreviousSchool.String,
		PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
		Disability:           dbStudent.Disability.Bool,
		DisabilityDetails:    dbStudent.DisabilityDetails.String,
		SubjectIDs:           req.SubjectIDs,
	}, nil
}

func (s *studentService) UpdateStudent(ctx context.Context, req *schema.UpdateStudentRequest) (*schema.Student, error) {
	guardianName := req.GuardianName
	if guardianName == "" {
		guardianName = strings.TrimSpace(req.GuardianFirstname + " " + req.GuardianLastname)
	}

	dbStudent, err := s.queries.UpdateStudent(ctx, dbsqlc.UpdateStudentParams{
		ID:                   int32(req.ID),
		StudentNumber:        req.StudentNumber,
		FirstName:            req.FirstName,
		MiddleName:           sql.NullString{String: req.MiddleName, Valid: req.MiddleName != ""},
		LastName:             req.LastName,
		DateOfBirth:          common.StringToNullTime(req.DateOfBirth),
		Gender:               sql.NullString{String: req.Gender, Valid: req.Gender != ""},
		FormLevel:            sql.NullInt32{Int32: int32(req.FormLevel), Valid: true},
		GuardianName:         sql.NullString{String: guardianName, Valid: guardianName != ""},
		GuardianPhone:        sql.NullString{String: req.GuardianPhone, Valid: req.GuardianPhone != ""},
		GuardianAltPhone:     sql.NullString{String: req.GuardianAltPhone, Valid: req.GuardianAltPhone != ""},
		GuardianEmail:        sql.NullString{String: req.GuardianEmail, Valid: req.GuardianEmail != ""},
		GuardianRelationship: sql.NullString{String: req.GuardianRelationship, Valid: req.GuardianRelationship != ""},
		PreviousSchool:       sql.NullString{String: req.PreviousSchool, Valid: req.PreviousSchool != ""},
		PreviousSchoolID:     sql.NullInt32{Int32: int32(req.PreviousSchoolID), Valid: req.PreviousSchoolID != 0},
		SchoolID:             int32(req.SchoolID),
		AcademicYearID:       sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: req.AcademicYearID != 0},
		Disability:           sql.NullBool{Bool: req.Disability, Valid: true},
		DisabilityDetails:    sql.NullString{String: req.DisabilityDetails, Valid: req.DisabilityDetails != ""},
		Status:               sql.NullString{String: req.Status, Valid: req.Status != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update student: %w", err)
	}

	if err := s.queries.DeleteStudentSubjectsByStudentID(ctx, int32(req.ID)); err != nil {
		return nil, fmt.Errorf("failed to delete existing student subjects: %w", err)
	}
	if err := s.createStudentSubjectAssignments(ctx, int32(req.ID), req.SubjectIDs); err != nil {
		return nil, fmt.Errorf("failed to assign student subjects: %w", err)
	}

	dateOfBirth := ""
	if dbStudent.DateOfBirth.Valid {
		dateOfBirth = dbStudent.DateOfBirth.Time.Format("2006-01-02")
	}

	return &schema.Student{
		ID:                   int64(dbStudent.ID),
		StudentNumber:        dbStudent.StudentNumber,
		FirstName:            dbStudent.FirstName,
		MiddleName:           dbStudent.MiddleName.String,
		LastName:             dbStudent.LastName,
		FormLevel:            int(dbStudent.FormLevel.Int32),
		SchoolID:             int64(dbStudent.SchoolID),
		DateOfBirth:          dateOfBirth,
		AcademicYearID:       int64(dbStudent.AcademicYearID.Int32),
		Status:               dbStudent.Status.String,
		Gender:               dbStudent.Gender.String,
		GuardianName:         dbStudent.GuardianName.String,
		GuardianPhone:        dbStudent.GuardianPhone.String,
		GuardianAltPhone:     dbStudent.GuardianAltPhone.String,
		GuardianEmail:        dbStudent.GuardianEmail.String,
		GuardianRelationship: dbStudent.GuardianRelationship.String,
		PreviousSchool:       dbStudent.PreviousSchool.String,
		PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
		Disability:           dbStudent.Disability.Bool,
		DisabilityDetails:    dbStudent.DisabilityDetails.String,
		SubjectIDs:           req.SubjectIDs,
	}, nil
}

func (s *studentService) DeleteStudent(ctx context.Context, studentID int64) error {
	err := s.queries.DeleteStudent(ctx, int32(studentID))
	if err != nil {
		return fmt.Errorf("failed to delete student: %w", err)
	}
	return nil
}
