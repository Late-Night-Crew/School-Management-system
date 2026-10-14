package services

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// End-of-term reports (see migration 25). A report is saved when a school's term
// closes and keeps the figures as they were; if marks change later it is flagged as out
// of date and can be regenerated. Forms 2 and 4 pass by the JCE/MSCE rule.

// passRules is what a learner needs to pass, by form.
type passRules struct {
	passMark   int
	needed     map[int]int            // form -> subjects to pass
	compulsory map[int]map[int64]bool // form -> subjects that must be passed (Forms 2 and 4)
}

func (r passRules) subjectsNeeded(form int) int {
	if n, ok := r.needed[form]; ok {
		return n
	}
	return r.needed[1]
}

// passes reports whether a learner's marks (subject -> mark) meet their form's rule.
func (r passRules) passes(form int, marks map[int64]int) (passed, missedCompulsory bool) {
	count := 0
	for _, mark := range marks {
		if mark >= r.passMark {
			count++
		}
	}
	for subject := range r.compulsory[form] {
		if mark, ok := marks[subject]; !ok || mark < r.passMark {
			missedCompulsory = true
		}
	}
	return count >= r.subjectsNeeded(form) && !missedCompulsory, missedCompulsory
}

func loadPassRules(ctx context.Context, queries *dbsqlc.Queries) (passRules, error) {
	settings, err := queries.GetPromotionSettings(ctx)
	if err != nil {
		return passRules{}, fmt.Errorf("failed to get promotion settings: %w", err)
	}
	scale, err := getGradingScale(ctx, queries)
	if err != nil {
		return passRules{}, err
	}
	if len(scale.Bands) == 0 {
		return passRules{}, newUserError(ErrInUse, "Set up the grading scale first: it gives the pass mark.")
	}
	rules := passRules{
		passMark: scale.PassMark,
		needed: map[int]int{
			1: int(settings.SubjectsToPass), 3: int(settings.SubjectsToPass),
			2: int(settings.JceSubjectsToPass), 4: int(settings.MsceSubjectsToPass),
		},
		compulsory: map[int]map[int64]bool{2: {}, 4: {}},
	}
	compulsory, err := queries.ListExamCompulsorySubjects(ctx)
	if err != nil {
		return passRules{}, fmt.Errorf("failed to list compulsory subjects: %w", err)
	}
	for _, c := range compulsory {
		form := 2
		if c.Exam == "MSCE" {
			form = 4
		}
		rules.compulsory[form][int64(c.SubjectID)] = true
	}
	return rules, nil
}

// termFigures is a computed report: the headline numbers, the breakdown and a
// fingerprint of the marks it was made from.
type termFigures struct {
	learners    int
	average     *float64
	passRate    *float64
	jce, msce   *float64
	details     schema.TermReportDetails
	fingerprint string
}

func ratio(part, whole int) *float64 {
	if whole == 0 {
		return nil
	}
	v := float64(part) / float64(whole) * 100
	return &v
}

func mean(sum, n int) *float64 {
	if n == 0 {
		return nil
	}
	v := float64(sum) / float64(n)
	return &v
}

// computeTermReport works out a term's figures from its marks (ordered by learner,
// then subject, as ListTermMarks returns them).
func computeTermReport(marks []dbsqlc.ListTermMarksRow, term int, rules passRules) termFigures {
	type learner struct {
		form  int
		marks map[int64]int
	}
	type subject struct {
		name             string
		count, sum, pass int
	}
	learners := map[int32]*learner{}
	subjects := map[int64]*subject{}
	hash := sha256.New()
	total := 0
	for _, m := range marks {
		fmt.Fprintf(hash, "%d:%d:%d;", m.StudentID, m.SubjectID, m.Mark)
		l := learners[m.StudentID]
		if l == nil {
			l = &learner{form: int(m.FormLevel), marks: map[int64]int{}}
			learners[m.StudentID] = l
		}
		l.marks[int64(m.SubjectID)] = int(m.Mark)
		sub := subjects[int64(m.SubjectID)]
		if sub == nil {
			sub = &subject{name: m.SubjectName}
			subjects[int64(m.SubjectID)] = sub
		}
		sub.count++
		sub.sum += int(m.Mark)
		if int(m.Mark) >= rules.passMark {
			sub.pass++
		}
		total += int(m.Mark)
	}

	type formTotals struct{ learners, passed, marks, sum int }
	forms := map[int]*formTotals{}
	passedAll := 0
	for _, l := range learners {
		f := forms[l.form]
		if f == nil {
			f = &formTotals{}
			forms[l.form] = f
		}
		f.learners++
		for _, mark := range l.marks {
			f.marks++
			f.sum += mark
		}
		if passed, _ := rules.passes(l.form, l.marks); passed {
			f.passed++
			passedAll++
		}
	}

	figures := termFigures{
		learners:    len(learners),
		average:     mean(total, len(marks)),
		passRate:    ratio(passedAll, len(learners)),
		details:     schema.TermReportDetails{PassMark: rules.passMark, Forms: []schema.FormStats{}, Subjects: []schema.SubjectStats{}},
		fingerprint: hex.EncodeToString(hash.Sum(nil)),
	}
	for form := 1; form <= 4; form++ {
		f := forms[form]
		if f == nil {
			continue
		}
		stats := schema.FormStats{
			Form: form, Learners: f.learners, AverageMark: mean(f.sum, f.marks),
			Passed: f.passed, PassRate: ratio(f.passed, f.learners), SubjectsNeeded: rules.subjectsNeeded(form),
		}
		figures.details.Forms = append(figures.details.Forms, stats)
		// Term 3 of Forms 2 and 4 is the JCE and MSCE
		if term == 3 && form == 2 {
			figures.jce = stats.PassRate
		}
		if term == 3 && form == 4 {
			figures.msce = stats.PassRate
		}
	}
	for id, sub := range subjects {
		figures.details.Subjects = append(figures.details.Subjects, schema.SubjectStats{
			SubjectID: id, Name: sub.name, Marks: sub.count,
			AverageMark: mean(sub.sum, sub.count), PassRate: ratio(sub.pass, sub.count),
		})
	}
	sort.Slice(figures.details.Subjects, func(i, j int) bool {
		return figures.details.Subjects[i].Name < figures.details.Subjects[j].Name
	})
	return figures
}

func nullFloat(v *float64) sql.NullFloat64 {
	if v == nil {
		return sql.NullFloat64{}
	}
	return sql.NullFloat64{Float64: *v, Valid: true}
}

// saveTermReport computes and saves (or replaces) a school's report for one term.
// Pass the queries of a transaction to save it together with other changes.
func saveTermReport(ctx context.Context, queries *dbsqlc.Queries, actorID, schoolID, yearID int64, term int, note string) error {
	rules, err := loadPassRules(ctx, queries)
	if err != nil {
		return err
	}
	return saveTermReportWith(ctx, queries, rules, actorID, schoolID, yearID, term, note)
}

// saveTermReportWith is saveTermReport with the pass rules already loaded (when many
// schools close a term at once).
func saveTermReportWith(ctx context.Context, queries *dbsqlc.Queries, rules passRules, actorID, schoolID, yearID int64, term int, note string) error {
	marks, err := queries.ListTermMarks(ctx, dbsqlc.ListTermMarksParams{SchoolID: int32(schoolID), AcademicYearID: int32(yearID), Term: int32(term)})
	if err != nil {
		return fmt.Errorf("failed to read term marks: %w", err)
	}
	figures := computeTermReport(marks, term, rules)
	details, err := json.Marshal(figures.details)
	if err != nil {
		return fmt.Errorf("failed to encode term report: %w", err)
	}
	err = queries.SaveTermReport(ctx, dbsqlc.SaveTermReportParams{
		SchoolID:         int32(schoolID),
		AcademicYearID:   int32(yearID),
		Term:             int32(term),
		LearnersAssessed: int32(figures.learners),
		AverageMark:      nullFloat(figures.average),
		PassRate:         nullFloat(figures.passRate),
		JcePassRate:      nullFloat(figures.jce),
		MscePassRate:     nullFloat(figures.msce),
		Details:          details,
		MarksFingerprint: figures.fingerprint,
		ActorUserID:      int32(actorID),
		Note:             note,
	})
	if err != nil {
		return fmt.Errorf("failed to save term report: %w", err)
	}
	return nil
}

// TermReportService reads, regenerates and compares end-of-term reports, and a
// learner's term-by-term progress.
type TermReportService interface {
	ListForSchool(ctx context.Context, schoolID int64) ([]*schema.TermReport, error)
	// Get returns a saved report, or the current term worked out live.
	Get(ctx context.Context, schoolID, yearID int64, term int) (*schema.TermReport, error)
	// Current works out the school's current term so far (ErrInUse: no term yet).
	Current(ctx context.Context, schoolID int64) (*schema.TermReport, error)
	Regenerate(ctx context.Context, actorID, schoolID, yearID int64, term int) (*schema.TermReport, error)
	ListForTerm(ctx context.Context, filter *schema.TermReportFilter) ([]*schema.SchoolTermRow, error)
	// LearnerProgress: schoolID limits it to that school's learners (0: any learner).
	LearnerProgress(ctx context.Context, schoolID, studentID int64) (*schema.LearnerProgress, error)
}

type termReportService struct {
	queries    *dbsqlc.Queries
	promotions PromotionService
	logger     logging.Logger
}

func NewTermReportService(queries *dbsqlc.Queries, promotions PromotionService, logger logging.Logger) TermReportService {
	return &termReportService{queries: queries, promotions: promotions, logger: logger}
}

// emptyFingerprint is the fingerprint of a term without marks.
var emptyFingerprint = func() string { sum := sha256.Sum256(nil); return hex.EncodeToString(sum[:]) }()

// fingerprints returns the fingerprint of each term's marks as they are now, keyed by
// academic year and term (yearID 0: every term). Worked out in the database, so the
// marks are not read into the server.
func (s *termReportService) fingerprints(ctx context.Context, schoolID, yearID int64, term int) (map[[2]int64]string, error) {
	rows, err := s.queries.ListTermMarkFingerprints(ctx, dbsqlc.ListTermMarkFingerprintsParams{
		SchoolID: int32(schoolID), AcademicYearID: optionalID(yearID), Term: optionalID(int64(term)),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check term marks: %w", err)
	}
	out := make(map[[2]int64]string, len(rows))
	for _, r := range rows {
		out[[2]int64{int64(r.AcademicYearID), int64(r.Term)}] = r.Fingerprint
	}
	return out, nil
}

// currentFingerprint is the fingerprint of one term's marks as they are now.
func (s *termReportService) currentFingerprint(ctx context.Context, schoolID, yearID int64, term int) (string, error) {
	all, err := s.fingerprints(ctx, schoolID, yearID, term)
	if err != nil {
		return "", err
	}
	if f, ok := all[[2]int64{yearID, int64(term)}]; ok {
		return f, nil
	}
	return emptyFingerprint, nil
}

func rate(v sql.NullFloat64) *float64 {
	if !v.Valid {
		return nil
	}
	return &v.Float64
}

func (s *termReportService) ListForSchool(ctx context.Context, schoolID int64) ([]*schema.TermReport, error) {
	rows, err := s.queries.ListSchoolTermReports(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to list term reports: %w", err)
	}
	reports := make([]*schema.TermReport, 0, len(rows)+1)
	// The current term first, worked out live
	if live, err := s.live(ctx, schoolID); err == nil {
		reports = append(reports, live)
	} else if !errors.Is(err, ErrInUse) {
		return nil, err
	}
	current, err := s.fingerprints(ctx, schoolID, 0, 0)
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		var details schema.TermReportDetails
		if err := json.Unmarshal(row.Details, &details); err != nil {
			return nil, fmt.Errorf("failed to read term report: %w", err)
		}
		fingerprint, ok := current[[2]int64{int64(row.AcademicYearID), int64(row.Term)}]
		if !ok {
			fingerprint = emptyFingerprint
		}
		reports = append(reports, &schema.TermReport{
			SchoolID: schoolID, AcademicYearID: int64(row.AcademicYearID), Year: int(row.Year), Term: int(row.Term),
			LearnersAssessed: int(row.LearnersAssessed), AverageMark: rate(row.AverageMark), PassRate: rate(row.PassRate),
			JCEPassRate: rate(row.JcePassRate), MSCEPassRate: rate(row.MscePassRate), Details: &details,
			GeneratedAt: row.GeneratedAt.Format(transferTimeFormat), OutOfDate: fingerprint != row.MarksFingerprint,
		})
	}
	return reports, nil
}

// live works out the school's current term from its marks so far, without saving it.
func (s *termReportService) live(ctx context.Context, schoolID int64) (*schema.TermReport, error) {
	stage, err := s.promotions.GetStage(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	rules, err := loadPassRules(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	marks, err := s.queries.ListTermMarks(ctx, dbsqlc.ListTermMarksParams{SchoolID: int32(schoolID), AcademicYearID: int32(stage.AcademicYearID), Term: int32(stage.Term)})
	if err != nil {
		return nil, fmt.Errorf("failed to read term marks: %w", err)
	}
	figures := computeTermReport(marks, stage.Term, rules)
	return &schema.TermReport{
		SchoolID: schoolID, AcademicYearID: stage.AcademicYearID, Year: stage.Year, Term: stage.Term,
		LearnersAssessed: figures.learners, AverageMark: figures.average, PassRate: figures.passRate,
		JCEPassRate: figures.jce, MSCEPassRate: figures.msce, Details: &figures.details, Live: true,
	}, nil
}

func (s *termReportService) Current(ctx context.Context, schoolID int64) (*schema.TermReport, error) {
	return s.live(ctx, schoolID)
}

func (s *termReportService) Get(ctx context.Context, schoolID, yearID int64, term int) (*schema.TermReport, error) {
	row, err := s.queries.GetTermReport(ctx, dbsqlc.GetTermReportParams{SchoolID: int32(schoolID), AcademicYearID: int32(yearID), Term: int32(term)})
	if errors.Is(err, sql.ErrNoRows) {
		live, liveErr := s.live(ctx, schoolID)
		if liveErr == nil && live.AcademicYearID == yearID && live.Term == term {
			return live, nil
		}
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get term report: %w", err)
	}
	var details schema.TermReportDetails
	if err := json.Unmarshal(row.Details, &details); err != nil {
		return nil, fmt.Errorf("failed to read term report: %w", err)
	}
	fingerprint, err := s.currentFingerprint(ctx, schoolID, yearID, term)
	if err != nil {
		return nil, err
	}
	return &schema.TermReport{
		SchoolID: schoolID, AcademicYearID: int64(row.AcademicYearID), Year: int(row.Year), Term: int(row.Term),
		LearnersAssessed: int(row.LearnersAssessed), AverageMark: rate(row.AverageMark), PassRate: rate(row.PassRate),
		JCEPassRate: rate(row.JcePassRate), MSCEPassRate: rate(row.MscePassRate), Details: &details,
		GeneratedByName: row.GeneratedByName, GeneratedAt: row.GeneratedAt.Format(transferTimeFormat),
		OutOfDate: fingerprint != row.MarksFingerprint,
	}, nil
}

func (s *termReportService) Regenerate(ctx context.Context, actorID, schoolID, yearID int64, term int) (*schema.TermReport, error) {
	if _, err := s.queries.GetTermReport(ctx, dbsqlc.GetTermReportParams{SchoolID: int32(schoolID), AcademicYearID: int32(yearID), Term: int32(term)}); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, newUserError(ErrInUse, "This term has no saved report yet; it is saved when the term closes.")
		}
		return nil, fmt.Errorf("failed to get term report: %w", err)
	}
	if err := saveTermReport(ctx, s.queries, actorID, schoolID, yearID, term, fmt.Sprintf("Term %d report regenerated after marks changed", term)); err != nil {
		return nil, err
	}
	return s.Get(ctx, schoolID, yearID, term)
}

func (s *termReportService) ListForTerm(ctx context.Context, filter *schema.TermReportFilter) ([]*schema.SchoolTermRow, error) {
	rows, err := s.queries.ListTermReportsForTerm(ctx, dbsqlc.ListTermReportsForTermParams{
		AcademicYearID: int32(filter.AcademicYearID), Term: int32(filter.Term), RegionID: optionalID(filter.RegionID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list term reports: %w", err)
	}
	out := make([]*schema.SchoolTermRow, 0, len(rows))
	for _, row := range rows {
		out = append(out, &schema.SchoolTermRow{
			SchoolID: int64(row.SchoolID), SchoolName: row.SchoolName, SchoolNumber: row.SchoolNumber,
			DistrictName: row.DistrictName, RegionID: int64(row.RegionID), RegionName: row.RegionName,
			LearnersAssessed: int(row.LearnersAssessed), AverageMark: rate(row.AverageMark), PassRate: rate(row.PassRate),
			JCEPassRate: rate(row.JcePassRate), MSCEPassRate: rate(row.MscePassRate),
			GeneratedAt: row.GeneratedAt.Format(transferTimeFormat),
		})
	}
	return out, nil
}

func (s *termReportService) LearnerProgress(ctx context.Context, schoolID, studentID int64) (*schema.LearnerProgress, error) {
	if schoolID > 0 {
		_, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{ID: int32(studentID), SchoolID: int32(schoolID)})
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		if err != nil {
			return nil, fmt.Errorf("failed to look up learner %d: %w", studentID, err)
		}
	}
	scale, err := getGradingScale(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	rows, err := s.queries.ListStudentTermSummaries(ctx, dbsqlc.ListStudentTermSummariesParams{PassMark: int32(scale.PassMark), StudentID: int32(studentID)})
	if err != nil {
		return nil, fmt.Errorf("failed to get learner progress: %w", err)
	}
	progress := &schema.LearnerProgress{PassMark: scale.PassMark, Terms: make([]schema.TermProgress, 0, len(rows))}
	for _, row := range rows {
		progress.Terms = append(progress.Terms, schema.TermProgress{
			AcademicYearID: int64(row.AcademicYearID), Year: int(row.Year), Term: int(row.Term), SchoolName: row.SchoolName,
			SubjectsMarked: int(row.SubjectsMarked), SubjectsPassed: int(row.SubjectsPassed), AverageMark: row.AverageMark,
		})
	}
	return progress, nil
}
