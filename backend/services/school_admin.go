package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
	"strings"
)

type SchoolAdminService interface {
	GetDashboardStats(ctx context.Context, schoolID int64) (*schema.SchoolDashboardStats, error)
	GetStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) (*schema.Student, error)
	CreateStudentForSchool(ctx context.Context, schoolID int64, req *schema.CreateStudentRequest) (*schema.Student, error)
	UpdateStudentForSchool(ctx context.Context, schoolID int64, req *schema.UpdateStudentRequest) (*schema.Student, error)
	DeleteStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) error
	ListExamResultsBySchoolID(ctx context.Context, schoolID int64) ([]*schema.ExamResult, error)
	GetExamResultBySchoolIDAndYear(ctx context.Context, schoolID int64, academicYearID int64) (*schema.ExamResult, error)
	CreateExamResult(ctx context.Context, schoolID int64, req *schema.CreateExamResultRequest) (*schema.ExamResult, error)
	UpdateExamResult(ctx context.Context, schoolID int64, examResultID int64, req *schema.UpdateExamResultRequest) (*schema.ExamResult, error)
	// FindSimilar lists existing learners (at any school) who may be the one being registered.
	FindSimilar(ctx context.Context, check *schema.DuplicateCheckRequest) ([]schema.SimilarLearner, error)
	// MarkLeft marks a learner Withdrawn or DroppedOut; Reinstate brings them back.
	MarkLeft(ctx context.Context, actorID, schoolID, studentID int64, req *schema.LeaveRequest) error
	Reinstate(ctx context.Context, actorID, schoolID, studentID int64) error
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
		MaleCount:             stats.MaleCount,
		FemaleCount:           stats.FemaleCount,
		DisabilityCount:       stats.DisabilityCount,
		IncomingTransferCount: stats.IncomingTransferCount,
		OutgoingTransferCount: stats.OutgoingTransferCount,
		PendingIncomingCount:  stats.PendingIncomingCount,
		PendingOutgoingCount:  stats.PendingOutgoingCount,
		ExamResultCount:       stats.ExamResultCount,
	}, nil
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

func (s *schoolAdminService) GetStudentByIDAndSchoolID(ctx context.Context, schoolID int64, studentID int64) (*schema.Student, error) {
	dbStudent, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{ID: int32(studentID), SchoolID: int32(schoolID)})
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to fetch student %d for school %d: %w", studentID, schoolID, err)
	}

	subjectIDsByStudent, err := s.loadStudentSubjectIDs(ctx, []int32{int32(dbStudent.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to load student subjects: %w", err)
	}

	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		MiddleName:    dbStudent.MiddleName.String,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:               dbStudent.Gender.String,
		FormLevel:            int(dbStudent.FormLevel.Int32),
		GuardianName:         dbStudent.GuardianName.String,
		GuardianPhone:        dbStudent.GuardianPhone.String,
		GuardianAltPhone:     dbStudent.GuardianAltPhone.String,
		GuardianEmail:        dbStudent.GuardianEmail.String,
		GuardianRelationship: dbStudent.GuardianRelationship.String,
		PreviousSchool:       dbStudent.PreviousSchool.String,
		PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
		SchoolID:             int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Disability:        dbStudent.Disability.Bool,
		DisabilityDetails: dbStudent.DisabilityDetails.String,
		NationalID:        dbStudent.NationalID.String,
		JCENumber:         dbStudent.JceNumber.String,
		LeftOn:            formatDate(dbStudent.LeftOn),
		LeavingReason:     dbStudent.LeavingReason.String,
		Status:            dbStudent.Status,
		SubjectIDs:        subjectIDsByStudent[int32(dbStudent.ID)],
	}, nil
}

func (s *schoolAdminService) createStudentSubjectAssignments(ctx context.Context, studentID int32, subjectIDs []int64) error {
	if len(subjectIDs) == 0 {
		return nil
	}

	for _, subjectID := range subjectIDs {
		if err := s.queries.CreateStudentSubjectAssignment(ctx, dbsqlc.CreateStudentSubjectAssignmentParams{
			StudentID: studentID,
			SubjectID: int32(subjectID),
		}); err != nil {
			return err
		}
	}

	return nil
}

func (s *schoolAdminService) loadStudentSubjectIDs(ctx context.Context, studentIDs []int32) (map[int32][]int64, error) {
	return subjectIDsFor(ctx, s.queries, studentIDs)
}

func (s *schoolAdminService) CreateStudentForSchool(ctx context.Context, schoolID int64, req *schema.CreateStudentRequest) (*schema.Student, error) {
	if req.AcademicYearID > 0 {
		if err := checkYearStarted(ctx, s.queries, req.AcademicYearID); err != nil {
			return nil, err
		}
	}
	if err := prepareLearnerIdentity(ctx, s.queries, &req.NationalID, &req.JCENumber, 0); err != nil {
		return nil, err
	}
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
		SchoolID:             int32(schoolID),
		AcademicYearID:       sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: req.AcademicYearID != 0},
		Disability:           sql.NullBool{Bool: req.Disability, Valid: true},
		DisabilityDetails:    sql.NullString{String: req.DisabilityDetails, Valid: req.DisabilityDetails != ""},
		NationalID:           common.NullString(req.NationalID),
		JceNumber:            common.NullString(req.JCENumber),
		Status:               schema.StudentActive, // new learners are active; leaving has its own action
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create student for school %d: %w", schoolID, err)
	}

	if err := s.createStudentSubjectAssignments(ctx, dbStudent.ID, req.SubjectIDs); err != nil {
		return nil, fmt.Errorf("failed to assign student subjects: %w", err)
	}

	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		MiddleName:    dbStudent.MiddleName.String,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:               dbStudent.Gender.String,
		FormLevel:            int(dbStudent.FormLevel.Int32),
		GuardianName:         dbStudent.GuardianName.String,
		GuardianPhone:        dbStudent.GuardianPhone.String,
		GuardianAltPhone:     dbStudent.GuardianAltPhone.String,
		GuardianEmail:        dbStudent.GuardianEmail.String,
		GuardianRelationship: dbStudent.GuardianRelationship.String,
		PreviousSchool:       dbStudent.PreviousSchool.String,
		PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
		SchoolID:             int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Disability:        dbStudent.Disability.Bool,
		DisabilityDetails: dbStudent.DisabilityDetails.String,
		NationalID:        dbStudent.NationalID.String,
		JCENumber:         dbStudent.JceNumber.String,
		LeftOn:            formatDate(dbStudent.LeftOn),
		LeavingReason:     dbStudent.LeavingReason.String,
		Status:            dbStudent.Status,
		SubjectIDs:        req.SubjectIDs,
	}, nil
}

func (s *schoolAdminService) UpdateStudentForSchool(ctx context.Context, schoolID int64, req *schema.UpdateStudentRequest) (*schema.Student, error) {
	current, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{ID: int32(req.ID), SchoolID: int32(schoolID)})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to look up student %d: %w", req.ID, err)
	}
	if req.AcademicYearID > 0 {
		if err := checkYearStarted(ctx, s.queries, req.AcademicYearID); err != nil {
			return nil, err
		}
	}
	if err := prepareLearnerIdentity(ctx, s.queries, &req.NationalID, &req.JCENumber, req.ID); err != nil {
		return nil, err
	}
	guardianName := req.GuardianName
	if guardianName == "" {
		guardianName = strings.TrimSpace(req.GuardianFirstname + " " + req.GuardianLastname)
	}

	dbStudent, err := s.queries.UpdateStudentByIDAndSchoolID(ctx, dbsqlc.UpdateStudentByIDAndSchoolIDParams{
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
		SchoolID:             int32(schoolID),
		AcademicYearID:       sql.NullInt32{Int32: int32(req.AcademicYearID), Valid: req.AcademicYearID != 0},
		Disability:           sql.NullBool{Bool: req.Disability, Valid: true},
		DisabilityDetails:    sql.NullString{String: req.DisabilityDetails, Valid: req.DisabilityDetails != ""},
		NationalID:           common.NullString(req.NationalID),
		JceNumber:            common.NullString(req.JCENumber),
		Status:               current.Status, // status changes only through leave/reinstate/year end
		SchoolID_2:           int32(schoolID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update student %d for school %d: %w", req.ID, schoolID, err)
	}

	if err := s.queries.DeleteStudentSubjectsByStudentID(ctx, int32(req.ID)); err != nil {
		return nil, fmt.Errorf("failed to delete existing student subjects: %w", err)
	}
	if err := s.createStudentSubjectAssignments(ctx, int32(req.ID), req.SubjectIDs); err != nil {
		return nil, fmt.Errorf("failed to assign student subjects: %w", err)
	}

	return &schema.Student{
		ID:            int64(dbStudent.ID),
		StudentNumber: dbStudent.StudentNumber,
		FirstName:     dbStudent.FirstName,
		MiddleName:    dbStudent.MiddleName.String,
		LastName:      dbStudent.LastName,
		DateOfBirth: func() string {
			if dbStudent.DateOfBirth.Valid {
				return dbStudent.DateOfBirth.Time.Format("2006-01-02")
			}
			return ""
		}(),
		Gender:               dbStudent.Gender.String,
		FormLevel:            int(dbStudent.FormLevel.Int32),
		GuardianName:         dbStudent.GuardianName.String,
		GuardianPhone:        dbStudent.GuardianPhone.String,
		GuardianAltPhone:     dbStudent.GuardianAltPhone.String,
		GuardianEmail:        dbStudent.GuardianEmail.String,
		GuardianRelationship: dbStudent.GuardianRelationship.String,
		PreviousSchool:       dbStudent.PreviousSchool.String,
		PreviousSchoolID:     int64(dbStudent.PreviousSchoolID.Int32),
		SchoolID:             int64(dbStudent.SchoolID),
		AcademicYearID: func() int64 {
			if dbStudent.AcademicYearID.Valid {
				return int64(dbStudent.AcademicYearID.Int32)
			}
			return 0
		}(),
		Disability:        dbStudent.Disability.Bool,
		DisabilityDetails: dbStudent.DisabilityDetails.String,
		NationalID:        dbStudent.NationalID.String,
		JCENumber:         dbStudent.JceNumber.String,
		LeftOn:            formatDate(dbStudent.LeftOn),
		LeavingReason:     dbStudent.LeavingReason.String,
		Status:            dbStudent.Status,
		SubjectIDs:        req.SubjectIDs,
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
	if err := checkYearStarted(ctx, s.queries, req.AcademicYearID); err != nil {
		return nil, err
	}
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

func (s *schoolAdminService) FindSimilar(ctx context.Context, check *schema.DuplicateCheckRequest) ([]schema.SimilarLearner, error) {
	return FindSimilarLearners(ctx, s.queries, check)
}

func (s *schoolAdminService) MarkLeft(ctx context.Context, actorID, schoolID, studentID int64, req *schema.LeaveRequest) error {
	return markLearnerLeft(ctx, s.queries, actorID, schoolID, studentID, req)
}

func (s *schoolAdminService) Reinstate(ctx context.Context, actorID, schoolID, studentID int64) error {
	return reinstateLearner(ctx, s.queries, actorID, schoolID, studentID)
}
