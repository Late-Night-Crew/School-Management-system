package services

import (
	"context"
	"fmt"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/schema"
)

// LearnerSearchService pages through learners on the server, so the lists stay quick
// however many learners there are.
type LearnerSearchService interface {
	Search(ctx context.Context, filter *schema.StudentSearch) (*schema.StudentPage, error)
}

type learnerSearchService struct {
	queries *dbsqlc.Queries
}

func NewLearnerSearchService(queries *dbsqlc.Queries) LearnerSearchService {
	return &learnerSearchService{queries: queries}
}

const defaultStudentPageSize = 25

func (s *learnerSearchService) Search(ctx context.Context, filter *schema.StudentSearch) (*schema.StudentPage, error) {
	page, size := filter.Page, filter.PageSize
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = defaultStudentPageSize
	}
	where := dbsqlc.CountStudentsParams{
		RegionID:   optionalID(filter.RegionID),
		DistrictID: optionalID(filter.DistrictID),
		SchoolID:   optionalID(filter.SchoolID),
		FormLevel:  optionalID(int64(filter.FormLevel)),
		Status:     common.NullString(filter.Status),
		Search:     common.NullString(strings.TrimSpace(filter.Search)),
	}
	rows, err := s.queries.SearchStudents(ctx, dbsqlc.SearchStudentsParams{
		RegionID: where.RegionID, DistrictID: where.DistrictID, SchoolID: where.SchoolID, FormLevel: where.FormLevel,
		Status: where.Status, Search: where.Search, PageSize: int32(size), PageOffset: int32((page - 1) * size),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to search learners: %w", err)
	}
	total, err := s.queries.CountStudents(ctx, where)
	if err != nil {
		return nil, fmt.Errorf("failed to count learners: %w", err)
	}
	ids := make([]int32, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID)
	}
	subjects, err := subjectIDsFor(ctx, s.queries, ids)
	if err != nil {
		return nil, err
	}
	out := &schema.StudentPage{Students: make([]schema.StudentListItem, 0, len(rows)), Total: int(total), Page: page, PageSize: size}
	for _, r := range rows {
		out.Students = append(out.Students, schema.StudentListItem{
			Student: schema.Student{
				ID: int64(r.ID), StudentNumber: r.StudentNumber, FirstName: r.FirstName, MiddleName: r.MiddleName,
				LastName: r.LastName, Gender: r.Gender, FormLevel: int(r.FormLevel), DateOfBirth: formatDate(r.DateOfBirth),
				SchoolID: int64(r.SchoolID), AcademicYearID: int64(r.AcademicYearID), Status: r.Status,
				GuardianName: r.GuardianName, GuardianPhone: r.GuardianPhone, GuardianAltPhone: r.GuardianAltPhone,
				GuardianEmail: r.GuardianEmail, GuardianRelationship: r.GuardianRelationship,
				PreviousSchool: r.PreviousSchool, PreviousSchoolID: int64(r.PreviousSchoolID),
				Disability: r.Disability, DisabilityDetails: r.DisabilityDetails, SubjectIDs: subjects[r.ID],
				NationalID: r.NationalID, JCENumber: r.JceNumber, LeftOn: formatDate(r.LeftOn), LeavingReason: r.LeavingReason,
			},
			SchoolName: r.SchoolName, DistrictID: int64(r.DistrictID), DistrictName: r.DistrictName,
			RegionID: int64(r.RegionID), RegionName: r.RegionName,
		})
	}
	return out, nil
}

// subjectIDsFor returns the subject choices of the given learners in one query.
func subjectIDsFor(ctx context.Context, queries *dbsqlc.Queries, studentIDs []int32) (map[int32][]int64, error) {
	out := make(map[int32][]int64, len(studentIDs))
	if len(studentIDs) == 0 {
		return out, nil
	}
	rows, err := queries.ListSubjectIDsForStudents(ctx, studentIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to load learners' subjects: %w", err)
	}
	for _, r := range rows {
		out[r.StudentID] = append(out[r.StudentID], int64(r.SubjectID))
	}
	return out, nil
}
