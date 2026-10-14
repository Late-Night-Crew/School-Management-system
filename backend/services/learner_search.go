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
	// Downloads of learners' details are recorded: a spreadsheet export, or any large
	// pull beyond one school's own list
	if page == 1 && (filter.Export || (filter.SchoolID == 0 && size > 500)) {
		if err := recordAudit(ctx, s.queries, "student", 0, "Exported", describeLearnerExport(filter, int(total))); err != nil {
			return nil, err
		}
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
		if filter.Overview {
			hidePersonalDetails(&out.Students[len(out.Students)-1].Student)
		}
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

// hidePersonalDetails blanks what a list of learners does not need to show.
func hidePersonalDetails(s *schema.Student) {
	s.DateOfBirth, s.NationalID, s.JCENumber = "", "", ""
	s.GuardianName, s.GuardianPhone, s.GuardianAltPhone, s.GuardianEmail, s.GuardianRelationship = "", "", "", "", ""
	s.DisabilityDetails, s.LeavingReason = "", ""
	s.SubjectIDs = nil
}

// describeLearnerExport is e.g. "Downloaded 1,204 learners (division 2, Form 3, Left, search "banda")".
func describeLearnerExport(f *schema.StudentSearch, total int) string {
	var scope []string
	for _, part := range []struct {
		id   int64
		name string
	}{{f.RegionID, "division"}, {f.DistrictID, "district"}, {f.SchoolID, "school"}} {
		if part.id > 0 {
			scope = append(scope, fmt.Sprintf("%s %d", part.name, part.id))
		}
	}
	if f.FormLevel > 0 {
		scope = append(scope, fmt.Sprintf("Form %d", f.FormLevel))
	}
	if f.Status != "" {
		scope = append(scope, f.Status)
	}
	if s := strings.TrimSpace(f.Search); s != "" {
		scope = append(scope, fmt.Sprintf("search %q", s))
	}
	where := "all learners"
	if len(scope) > 0 {
		where = strings.Join(scope, ", ")
	}
	return fmt.Sprintf("Downloaded %d learners (%s)", total, where)
}
