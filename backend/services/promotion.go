package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// PromotionService moves schools through the terms of the year and learners into the
// next form at the end of it. See migration 24 for the rules.
type PromotionService interface {
	GetSettings(ctx context.Context) (*schema.PromotionSettings, error)
	UpdateSettings(ctx context.Context, actorID int64, req *schema.UpdatePromotionSettingsRequest) (*schema.PromotionSettings, error)
	GetStage(ctx context.Context, schoolID int64) (*schema.SchoolStage, error)
	ListStages(ctx context.Context) ([]*schema.SchoolStage, error)
	// AdvanceTerm moves a school from Term 1 to 2 or 2 to 3. Term 3 ends with ApplyYearEnd.
	AdvanceTerm(ctx context.Context, actorID, schoolID int64) (*schema.SchoolStage, error)
	// AdvanceAll moves every open school in fromTerm to the next term; returns how many.
	AdvanceAll(ctx context.Context, actorID int64, fromTerm int) (int, error)
	PreviewYearEnd(ctx context.Context, schoolID int64) (*schema.YearEndPreview, error)
	// ApplyYearEnd records every learner's result, moves them, and puts the school in
	// Term 1 of the next academic year.
	ApplyYearEnd(ctx context.Context, actorID, schoolID int64, req *schema.ApplyYearEndRequest) (*schema.YearEndSummary, error)
	// RunAutomatic applies the recommended outcomes for every school in Term 3. Only
	// when automatic promotion is switched on.
	RunAutomatic(ctx context.Context, actorID int64) ([]schema.YearEndSummary, error)
	LastYearResults(ctx context.Context, schoolID int64) (*schema.YearResults, error)
	// AllowToProceed lets a Form 1 or 3 learner who failed move up after all.
	AllowToProceed(ctx context.Context, actorID, schoolID, studentID int64) error
}

type promotionService struct {
	db      *sql.DB
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewPromotionService(db *sql.DB, queries *dbsqlc.Queries, logger logging.Logger) PromotionService {
	return &promotionService{db: db, queries: queries, logger: logger}
}

// yearEndOptions is the rule for one learner: what is recommended and what may be
// chosen, given their form and whether they passed enough subjects in Term 3.
func yearEndOptions(form int, passed bool) (recommended string, allowed []string) {
	switch {
	case form >= 4 && passed:
		return schema.OutcomeCompleted, []string{schema.OutcomeCompleted}
	case form >= 4:
		// Failed the national exams: re-enrol in Form 4 and rewrite
		return schema.OutcomeRewrite, []string{schema.OutcomeRewrite}
	case passed:
		return schema.OutcomePromoted, []string{schema.OutcomePromoted}
	case form == 2:
		// Failed JCE: repeat Form 2
		return schema.OutcomeRepeat, []string{schema.OutcomeRepeat}
	default:
		// Failed Form 1 or 3: repeat is recommended, moving up can be allowed
		return schema.OutcomeRepeat, []string{schema.OutcomeRepeat, schema.OutcomeProceeded}
	}
}

// formAfter is the form a learner is in after an outcome.
func formAfter(form int, outcome string) int {
	if (outcome == schema.OutcomePromoted || outcome == schema.OutcomeProceeded) && form < 4 {
		return form + 1
	}
	return form
}

func (s *promotionService) GetSettings(ctx context.Context) (*schema.PromotionSettings, error) {
	row, err := s.queries.GetPromotionSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get promotion settings: %w", err)
	}
	settings := &schema.PromotionSettings{
		Automatic:          row.Automatic,
		SubjectsToPass:     int(row.SubjectsToPass),
		JCESubjectsToPass:  int(row.JceSubjectsToPass),
		MSCESubjectsToPass: int(row.MsceSubjectsToPass),
		JCECompulsory:      []schema.SubjectRef{},
		MSCECompulsory:     []schema.SubjectRef{},
		UpdatedAt:          row.UpdatedAt.Format(transferTimeFormat),
	}
	compulsory, err := s.queries.ListExamCompulsorySubjects(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list compulsory subjects: %w", err)
	}
	for _, c := range compulsory {
		ref := schema.SubjectRef{ID: int64(c.SubjectID), Name: c.SubjectName}
		if c.Exam == "JCE" {
			settings.JCECompulsory = append(settings.JCECompulsory, ref)
		} else {
			settings.MSCECompulsory = append(settings.MSCECompulsory, ref)
		}
	}
	return settings, nil
}

func (s *promotionService) UpdateSettings(ctx context.Context, actorID int64, req *schema.UpdatePromotionSettingsRequest) (*schema.PromotionSettings, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	err = queries.UpdatePromotionSettings(ctx, dbsqlc.UpdatePromotionSettingsParams{
		Automatic:          req.Automatic,
		SubjectsToPass:     int32(req.SubjectsToPass),
		JceSubjectsToPass:  int32(req.JCESubjectsToPass),
		MsceSubjectsToPass: int32(req.MSCESubjectsToPass),
		ActorUserID:        int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to save promotion settings: %w", err)
	}
	for exam, ids := range map[string][]int64{"JCE": req.JCECompulsoryIDs, "MSCE": req.MSCECompulsoryIDs} {
		if err := queries.ClearExamCompulsorySubjects(ctx, exam); err != nil {
			return nil, fmt.Errorf("failed to clear %s compulsory subjects: %w", exam, err)
		}
		for _, id := range ids {
			if err := queries.AddExamCompulsorySubject(ctx, dbsqlc.AddExamCompulsorySubjectParams{Exam: exam, SubjectID: int32(id)}); err != nil {
				return nil, newUserError(ErrInvalidMove, "Subject %d does not exist.", id)
			}
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to save promotion settings: %w", err)
	}
	return s.GetSettings(ctx)
}

func (s *promotionService) GetStage(ctx context.Context, schoolID int64) (*schema.SchoolStage, error) {
	return getSchoolStage(ctx, s.queries, schoolID)
}

// getSchoolStage is the academic year and term a school is in (see GetStage); shared
// with the services that check marks against it.
func getSchoolStage(ctx context.Context, queries *dbsqlc.Queries, schoolID int64) (*schema.SchoolStage, error) {
	if err := schoolExists(ctx, queries, schoolID); err != nil {
		return nil, err
	}
	var yearID, term sql.NullInt32
	row, err := queries.GetSchoolStage(ctx, int32(schoolID))
	switch {
	case err == nil:
		yearID, term = sql.NullInt32{Int32: row.AcademicYearID, Valid: true}, sql.NullInt32{Int32: row.Term, Valid: true}
	case !errors.Is(err, sql.ErrNoRows):
		return nil, fmt.Errorf("failed to get stage for school %d: %w", schoolID, err)
	}
	return newStageResolver(queries).stage(ctx, schoolID, yearID, term)
}

// stageResolver works out schools' stages, reading each academic year, its term
// dates and the year after it once however many schools share them.
type stageResolver struct {
	queries     *dbsqlc.Queries
	today       time.Time
	years       map[int32]dbsqlc.GetAcademicYearByIDForStageRow
	defaultYear *dbsqlc.GetDefaultAcademicYearRow
	dates       map[[2]int32]*dbsqlc.GetTermDatesRow // nil: no dates set
	next        map[int32]*dbsqlc.GetNextAcademicYearRow
}

func newStageResolver(queries *dbsqlc.Queries) *stageResolver {
	return &stageResolver{
		queries: queries, today: TodayInMalawi(),
		years: map[int32]dbsqlc.GetAcademicYearByIDForStageRow{},
		dates: map[[2]int32]*dbsqlc.GetTermDatesRow{}, next: map[int32]*dbsqlc.GetNextAcademicYearRow{},
	}
}

// stage builds the stage of a school whose school_stages row holds yearID and term
// (both NULL when it has none: the default year, Term 1).
func (r *stageResolver) stage(ctx context.Context, schoolID int64, yearID, term sql.NullInt32) (*schema.SchoolStage, error) {
	stage := &schema.SchoolStage{SchoolID: schoolID, Term: 1}
	if yearID.Valid {
		year, ok := r.years[yearID.Int32]
		if !ok {
			var err error
			if year, err = r.queries.GetAcademicYearByIDForStage(ctx, yearID.Int32); err != nil {
				return nil, fmt.Errorf("failed to get academic year %d: %w", yearID.Int32, err)
			}
			r.years[yearID.Int32] = year
		}
		stage.AcademicYearID, stage.Year, stage.Term = int64(year.ID), int(year.Year), int(term.Int32)
	} else {
		if r.defaultYear == nil {
			year, err := r.queries.GetDefaultAcademicYear(ctx, r.today)
			if errors.Is(err, sql.ErrNoRows) {
				return nil, newUserError(ErrInUse, "No academic year has been set up yet. MCDE creates academic years under Manage → Academic Years.")
			}
			if err != nil {
				return nil, fmt.Errorf("failed to get the active academic year: %w", err)
			}
			r.defaultYear = &year
		}
		stage.AcademicYearID, stage.Year = int64(r.defaultYear.ID), int(r.defaultYear.Year)
	}

	key := [2]int32{int32(stage.AcademicYearID), int32(stage.Term)}
	dates, ok := r.dates[key]
	if !ok {
		row, err := r.queries.GetTermDates(ctx, dbsqlc.GetTermDatesParams{AcademicYearID: key[0], Term: key[1]})
		switch {
		case err == nil:
			dates = &row
		case !errors.Is(err, sql.ErrNoRows):
			return nil, fmt.Errorf("failed to get term dates: %w", err)
		}
		r.dates[key] = dates
	}
	if dates != nil {
		stage.TermStartDate, stage.TermEndDate = dates.StartDate.Format(time.DateOnly), dates.EndDate.Format(time.DateOnly)
		days := daysBetween(dates.EndDate, r.today)
		if days > 0 {
			stage.DaysOverdue = days
		}
		// The term's last day counts as over: schools usually close it that day
		stage.CanMoveOn = days >= 0
	}

	next, ok := r.next[int32(stage.Year)]
	if !ok {
		row, err := r.queries.GetNextAcademicYear(ctx, int32(stage.Year))
		switch {
		case err == nil:
			next = &row
		case !errors.Is(err, sql.ErrNoRows):
			return nil, fmt.Errorf("failed to get the next academic year: %w", err)
		}
		r.next[int32(stage.Year)] = next
	}
	if next != nil {
		stage.NextYearID, stage.NextYear = int64(next.ID), int(next.Year)
	}
	return stage, nil
}

func schoolExists(ctx context.Context, queries *dbsqlc.Queries, schoolID int64) error {
	_, err := queries.GetSchoolClosedAt(ctx, int32(schoolID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up school %d: %w", schoolID, err)
	}
	return nil
}

func (s *promotionService) ListStages(ctx context.Context) ([]*schema.SchoolStage, error) {
	rows, err := s.queries.ListSchoolStages(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list school stages: %w", err)
	}
	stages := make([]*schema.SchoolStage, 0, len(rows))
	resolver := newStageResolver(s.queries)
	for _, row := range rows {
		stage, err := resolver.stage(ctx, int64(row.SchoolID), row.AcademicYearID, row.Term)
		if err != nil {
			return nil, err
		}
		stage.SchoolName, stage.SchoolNumber = row.SchoolName, row.SchoolNumber
		stage.DistrictName, stage.RegionName, stage.Learners = row.DistrictName, row.RegionName, int(row.Learners)
		stages = append(stages, stage)
	}
	return stages, nil
}

func (s *promotionService) AdvanceTerm(ctx context.Context, actorID, schoolID int64) (*schema.SchoolStage, error) {
	stage, err := s.GetStage(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	if stage.Term >= 3 {
		return nil, newUserError(ErrInUse, "Term 3 ends with the year-end promotion, which moves learners and starts the next year.")
	}
	if err := termOver(stage); err != nil {
		return nil, err
	}
	rules, err := loadPassRules(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	moved, err := s.closeTerm(ctx, actorID, stage, rules)
	if err != nil {
		return nil, err
	}
	if !moved {
		return nil, newUserError(ErrInvalidMove, "The school's term changed while this was being done. Reload and try again.")
	}
	return s.GetStage(ctx, schoolID)
}

// closeTerm saves the report of the school's current term and moves it to the next
// term, in one transaction. It returns false, changing nothing, if the school is no
// longer in that term (someone else moved it meanwhile).
func (s *promotionService) closeTerm(ctx context.Context, actorID int64, stage *schema.SchoolStage, rules passRules) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)
	current, err := queries.LockSchoolStage(ctx, int32(stage.SchoolID))
	switch {
	case errors.Is(err, sql.ErrNoRows):
		// No stage saved yet: the school is in Term 1 of the default year
		if stage.Term != 1 {
			return false, nil
		}
	case err != nil:
		return false, fmt.Errorf("failed to read school %d's term: %w", stage.SchoolID, err)
	case int64(current.AcademicYearID) != stage.AcademicYearID || int(current.Term) != stage.Term:
		return false, nil
	}
	note := fmt.Sprintf("%d Term %d report saved as the term closed", stage.Year, stage.Term)
	if err := saveTermReportWith(ctx, queries, rules, actorID, stage.SchoolID, stage.AcademicYearID, stage.Term, note); err != nil {
		return false, err
	}
	err = queries.SetSchoolStage(ctx, dbsqlc.SetSchoolStageParams{
		SchoolID:       int32(stage.SchoolID),
		AcademicYearID: int32(stage.AcademicYearID),
		Term:           int32(stage.Term + 1),
		ActorUserID:    int32(actorID),
		Note:           fmt.Sprintf("%d: Term %d to Term %d", stage.Year, stage.Term, stage.Term+1),
	})
	if err != nil {
		return false, fmt.Errorf("failed to move school %d to the next term: %w", stage.SchoolID, err)
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("failed to move school %d to the next term: %w", stage.SchoolID, err)
	}
	return true, nil
}

func (s *promotionService) AdvanceAll(ctx context.Context, actorID int64, fromTerm int) (int, error) {
	stages, err := s.ListStages(ctx)
	if err != nil {
		return 0, err
	}
	// Read once for every school, not once per school
	rules, err := loadPassRules(ctx, s.queries)
	if err != nil {
		return 0, err
	}
	moved := 0
	for _, stage := range stages {
		if stage.Term != fromTerm || !stage.CanMoveOn {
			continue // not in that term, or the term is not over yet
		}
		ok, err := s.closeTerm(ctx, actorID, stage, rules)
		if err != nil {
			return moved, fmt.Errorf("moved %d schools, then %s failed: %w", moved, stage.SchoolName, err)
		}
		if ok {
			moved++
		}
	}
	return moved, nil
}

func (s *promotionService) PreviewYearEnd(ctx context.Context, schoolID int64) (*schema.YearEndPreview, error) {
	stage, err := s.GetStage(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	settings, err := s.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	rules, err := loadPassRules(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	rows, err := s.queries.ListYearEndLearners(ctx, dbsqlc.ListYearEndLearnersParams{
		PassMark:       int32(rules.passMark),
		AcademicYearID: int32(stage.AcademicYearID),
		SchoolID:       int32(schoolID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list learners for year end: %w", err)
	}
	preview := &schema.YearEndPreview{
		Stage:          *stage,
		Automatic:      settings.Automatic,
		SubjectsToPass: settings.SubjectsToPass,
		PassMark:       rules.passMark,
		Learners:       make([]schema.YearEndLearner, 0, len(rows)),
	}
	for _, row := range rows {
		// Forms 2 and 4 follow the JCE/MSCE rule: enough subjects and every compulsory one
		needed := rules.subjectsNeeded(int(row.FormLevel))
		missedCompulsory := row.CompulsoryPassed < row.CompulsoryRequired
		passed := int(row.SubjectsPassed) >= needed && !missedCompulsory
		recommended, allowed := yearEndOptions(int(row.FormLevel), passed)
		preview.Learners = append(preview.Learners, schema.YearEndLearner{
			StudentID:        int64(row.ID),
			Name:             strings.TrimSpace(row.FirstName + " " + row.LastName),
			StudentNumber:    row.StudentNumber,
			FormLevel:        int(row.FormLevel),
			SubjectsPassed:   int(row.SubjectsPassed),
			SubjectsMarked:   int(row.SubjectsMarked),
			SubjectsNeeded:   needed,
			MissedCompulsory: missedCompulsory,
			Passed:           passed,
			Recommended:      recommended,
			Allowed:          allowed,
		})
	}
	return preview, nil
}

func (s *promotionService) ApplyYearEnd(ctx context.Context, actorID, schoolID int64, req *schema.ApplyYearEndRequest) (*schema.YearEndSummary, error) {
	return s.applyYearEnd(ctx, actorID, schoolID, req, false)
}

func (s *promotionService) applyYearEnd(ctx context.Context, actorID, schoolID int64, req *schema.ApplyYearEndRequest, automatic bool) (*schema.YearEndSummary, error) {
	preview, err := s.PreviewYearEnd(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	stage := preview.Stage
	if stage.Term != 3 {
		return nil, newUserError(ErrInUse, "The year-end promotion happens at the end of Term 3; this school is in Term %d.", stage.Term)
	}
	if err := termOver(&stage); err != nil {
		return nil, err
	}
	if stage.NextYearID == 0 {
		return nil, newUserError(ErrInUse, "Create the %d academic year first (Manage → Academic Years): learners move into it.", stage.Year+1)
	}

	learners := make(map[int64]schema.YearEndLearner, len(preview.Learners))
	for _, learner := range preview.Learners {
		learners[learner.StudentID] = learner
	}
	chosen := make(map[int64]string, len(req.Decisions))
	for _, decision := range req.Decisions {
		learner, ok := learners[decision.StudentID]
		if !ok {
			return nil, newUserError(ErrInvalidMove, "Learner %d is not waiting for a year-end result at this school.", decision.StudentID)
		}
		if !contains(learner.Allowed, decision.Outcome) {
			return nil, newUserError(ErrInvalidMove, "%s (Form %d) cannot be marked %s.", learner.Name, learner.FormLevel, decision.Outcome)
		}
		chosen[decision.StudentID] = decision.Outcome
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()
	queries := s.queries.WithTx(tx)

	// Term 3's report (with the JCE and MSCE pass rates) is saved before learners move
	if err := saveTermReport(ctx, queries, actorID, schoolID, stage.AcademicYearID, 3, fmt.Sprintf("%d Term 3 report saved at the year end", stage.Year)); err != nil {
		return nil, err
	}

	summary := &schema.YearEndSummary{SchoolID: schoolID, Outcomes: map[string]int{}, NextYear: stage.NextYear}
	// Every learner's result and move, written in two statements
	n := len(preview.Learners)
	results := dbsqlc.CreatePromotionsParams{
		SchoolID: int32(schoolID), AcademicYearID: int32(stage.AcademicYearID), Automatic: automatic, ActorUserID: int32(actorID),
		StudentIds: make([]int32, 0, n), FromForms: make([]int32, 0, n), ToForms: make([]int32, 0, n),
		SubjectsPassed: make([]int32, 0, n), Outcomes: make([]string, 0, n),
	}
	moves := dbsqlc.MoveStudentsAfterYearEndParams{
		AcademicYearID: int32(stage.NextYearID),
		StudentIds:     make([]int32, 0, n), FormLevels: make([]int32, 0, n), Statuses: make([]string, 0, n),
	}
	for _, learner := range preview.Learners {
		outcome, ok := chosen[learner.StudentID]
		if !ok {
			outcome = learner.Recommended
		}
		toForm := formAfter(learner.FormLevel, outcome)
		status := "Active"
		if outcome == schema.OutcomeCompleted {
			status = schema.StudentStatusCompleted
		}
		results.StudentIds = append(results.StudentIds, int32(learner.StudentID))
		results.FromForms = append(results.FromForms, int32(learner.FormLevel))
		results.ToForms = append(results.ToForms, int32(toForm))
		results.SubjectsPassed = append(results.SubjectsPassed, int32(learner.SubjectsPassed))
		results.Outcomes = append(results.Outcomes, outcome)
		moves.StudentIds = append(moves.StudentIds, int32(learner.StudentID))
		moves.FormLevels = append(moves.FormLevels, int32(toForm))
		moves.Statuses = append(moves.Statuses, status)
		summary.Outcomes[outcome]++
	}
	if n > 0 {
		if err := queries.CreatePromotions(ctx, results); err != nil {
			return nil, fmt.Errorf("failed to record year-end results: %w", err)
		}
		if err := queries.MoveStudentsAfterYearEnd(ctx, moves); err != nil {
			return nil, fmt.Errorf("failed to move learners into the next year: %w", err)
		}
	}

	err = queries.SetSchoolStage(ctx, dbsqlc.SetSchoolStageParams{
		SchoolID:       int32(schoolID),
		AcademicYearID: int32(stage.NextYearID),
		Term:           1,
		ActorUserID:    int32(actorID),
		Note:           fmt.Sprintf("Year-end %d (%s): %s; now %d Term 1", stage.Year, howApplied(automatic), describeOutcomes(summary.Outcomes), stage.NextYear),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to start the next year for school %d: %w", schoolID, err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to save the year-end promotion: %w", err)
	}
	return summary, nil
}

// describeOutcomes summarises a year end, e.g. "40 Promoted, 3 Repeat".
func describeOutcomes(outcomes map[string]int) string {
	if len(outcomes) == 0 {
		return "no learners"
	}
	keys := make([]string, 0, len(outcomes))
	for k := range outcomes {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, len(keys))
	for i, k := range keys {
		parts[i] = fmt.Sprintf("%d %s", outcomes[k], k)
	}
	return strings.Join(parts, ", ")
}

// termOver refuses to move a school on before its term has ended (or when MCDE has not
// set the term's dates).
func termOver(stage *schema.SchoolStage) error {
	if stage.TermEndDate == "" {
		return newUserError(ErrInUse, "MCDE has not set the dates of %d Term %d yet (Manage → Academic Years); they are needed before the school can move on.", stage.Year, stage.Term)
	}
	if !stage.CanMoveOn {
		end, _ := time.Parse(time.DateOnly, stage.TermEndDate)
		next := fmt.Sprintf("move to Term %d", stage.Term+1)
		if stage.Term == 3 {
			next = "finish the year"
		}
		return newUserError(ErrInUse, "Term %d is not over yet: it ends on %s. The school can %s from then.", stage.Term, end.Format("Monday 2 January"), next)
	}
	return nil
}

func howApplied(automatic bool) string {
	if automatic {
		return "automatic"
	}
	return "confirmed"
}

func contains(values []string, value string) bool {
	for _, v := range values {
		if v == value {
			return true
		}
	}
	return false
}

func (s *promotionService) RunAutomatic(ctx context.Context, actorID int64) ([]schema.YearEndSummary, error) {
	settings, err := s.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	if !settings.Automatic {
		return nil, newUserError(ErrInUse, "Automatic promotion is switched off; each school's coordinator confirms their own year end.")
	}
	stages, err := s.ListStages(ctx)
	if err != nil {
		return nil, err
	}
	summaries := []schema.YearEndSummary{}
	for _, stage := range stages {
		if stage.Term != 3 {
			continue
		}
		summary, err := s.applyYearEnd(ctx, actorID, stage.SchoolID, &schema.ApplyYearEndRequest{}, true)
		if err != nil {
			// Report the school and carry on with the others
			summaries = append(summaries, schema.YearEndSummary{SchoolID: stage.SchoolID, Error: stage.SchoolName + ": " + err.Error()})
			continue
		}
		summaries = append(summaries, *summary)
	}
	return summaries, nil
}

func (s *promotionService) LastYearResults(ctx context.Context, schoolID int64) (*schema.YearResults, error) {
	stage, err := s.GetStage(ctx, schoolID)
	if err != nil {
		return nil, err
	}
	previous, err := s.queries.GetPreviousAcademicYear(ctx, int32(stage.Year))
	if errors.Is(err, sql.ErrNoRows) {
		return &schema.YearResults{Results: []schema.YearResult{}}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get the previous academic year: %w", err)
	}
	rows, err := s.queries.ListYearResults(ctx, dbsqlc.ListYearResultsParams{SchoolID: int32(schoolID), AcademicYearID: previous.ID})
	if err != nil {
		return nil, fmt.Errorf("failed to list year results: %w", err)
	}
	results := &schema.YearResults{AcademicYearID: int64(previous.ID), Year: int(previous.Year), Results: make([]schema.YearResult, 0, len(rows))}
	// Failed Form 1/3 learners can still be allowed up while the school is in Term 1
	stillTerm1 := stage.Term == 1
	for _, row := range rows {
		results.Results = append(results.Results, schema.YearResult{
			StudentID:      int64(row.StudentID),
			Name:           strings.TrimSpace(row.FirstName + " " + row.LastName),
			StudentNumber:  row.StudentNumber,
			FromForm:       int(row.FromForm),
			ToForm:         int(row.ToForm),
			SubjectsPassed: int(row.SubjectsPassed),
			Outcome:        row.Outcome,
			Automatic:      row.Automatic,
			DecidedByName:  row.DecidedByName,
			DecidedAt:      row.DecidedAt.Format(transferTimeFormat),
			CanProceed:     stillTerm1 && row.Outcome == schema.OutcomeRepeat && (row.FromForm == 1 || row.FromForm == 3),
		})
	}
	return results, nil
}

func (s *promotionService) AllowToProceed(ctx context.Context, actorID, schoolID, studentID int64) error {
	stage, err := s.GetStage(ctx, schoolID)
	if err != nil {
		return err
	}
	if stage.Term != 1 {
		return newUserError(ErrInUse, "Learners can only be allowed to move up during Term 1, right after the year end.")
	}
	previous, err := s.queries.GetPreviousAcademicYear(ctx, int32(stage.Year))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to get the previous academic year: %w", err)
	}
	promotion, err := s.queries.GetPromotionForProceed(ctx, dbsqlc.GetPromotionForProceedParams{StudentID: int32(studentID), AcademicYearID: previous.ID})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to get learner %d's year-end result: %w", studentID, err)
	}
	if int64(promotion.CurrentSchoolID) != schoolID {
		return ErrNotFound
	}
	if promotion.Outcome != schema.OutcomeRepeat || (promotion.FromForm != 1 && promotion.FromForm != 3) || int(promotion.CurrentForm) != int(promotion.FromForm) {
		return newUserError(ErrInUse, "Only Form 1 and Form 3 learners who are repeating can be allowed to move up.")
	}
	if err := s.queries.ProceedAfterRepeat(ctx, dbsqlc.ProceedAfterRepeatParams{PromotionID: promotion.ID, ActorUserID: int32(actorID)}); err != nil {
		return fmt.Errorf("failed to move learner %d up: %w", studentID, err)
	}
	return nil
}
