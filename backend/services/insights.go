package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"nsms/database/dbsqlc"
	"nsms/schema"
)

// InsightsService gathers the figures for the dashboards' charts.
type InsightsService interface {
	// For returns the whole country (regionID and schoolID 0), one division or one school.
	For(ctx context.Context, regionID, schoolID int64) (*schema.Insights, error)
}

// trendYears is how many years of term reports the charts show.
const trendYears = 3

type insightsService struct {
	queries     *dbsqlc.Queries
	termReports TermReportService
}

func NewInsightsService(queries *dbsqlc.Queries, termReports TermReportService) InsightsService {
	return &insightsService{queries: queries, termReports: termReports}
}

func (s *insightsService) For(ctx context.Context, regionID, schoolID int64) (*schema.Insights, error) {
	region, school := optionalID(regionID), optionalID(schoolID)
	out := &schema.Insights{
		LearnersByForm: []schema.FormGender{}, Statuses: []schema.StatusCount{},
		Areas: []schema.AreaCount{}, SchoolTerms: []schema.TermCount{},
	}

	byForm, err := s.queries.InsightLearnersByForm(ctx, dbsqlc.InsightLearnersByFormParams{RegionID: region, SchoolID: school})
	if err != nil {
		return nil, fmt.Errorf("failed to count learners: %w", err)
	}
	forms := map[int]*schema.FormGender{}
	for _, row := range byForm {
		f := forms[int(row.FormLevel)]
		if f == nil {
			f = &schema.FormGender{Form: int(row.FormLevel)}
			forms[f.Form] = f
		}
		n := int(row.Learners)
		switch row.Gender {
		case "Male":
			f.Male += n
			out.Gender.Male += n
		case "Female":
			f.Female += n
			out.Gender.Female += n
		default:
			f.Other += n
			out.Gender.Other += n
		}
		out.Disability += int(row.WithDisability)
	}
	for form := 1; form <= 4; form++ {
		if f := forms[form]; f != nil {
			out.LearnersByForm = append(out.LearnersByForm, *f)
		} else {
			out.LearnersByForm = append(out.LearnersByForm, schema.FormGender{Form: form})
		}
	}

	statuses, err := s.queries.InsightLearnerStatuses(ctx, dbsqlc.InsightLearnerStatusesParams{RegionID: region, SchoolID: school})
	if err != nil {
		return nil, fmt.Errorf("failed to count learners: %w", err)
	}
	for _, row := range statuses {
		out.Statuses = append(out.Statuses, schema.StatusCount{Status: row.Status, Learners: int(row.Learners)})
	}

	if schoolID == 0 {
		areas, err := s.queries.InsightAreas(ctx, region)
		if err != nil {
			return nil, fmt.Errorf("failed to count schools: %w", err)
		}
		for _, row := range areas {
			out.Areas = append(out.Areas, schema.AreaCount{
				ID: int64(row.ID), Name: row.Name, Schools: int(row.Schools), Learners: int(row.Learners), Female: int(row.Female),
			})
		}
		terms, err := s.queries.InsightSchoolTerms(ctx, region)
		if err != nil {
			return nil, fmt.Errorf("failed to count schools: %w", err)
		}
		for _, row := range terms {
			out.SchoolTerms = append(out.SchoolTerms, schema.TermCount{Term: int(row.Term), Schools: int(row.Schools)})
		}
	}

	// The last three years of term reports
	reports, err := s.queries.InsightTermReports(ctx, dbsqlc.InsightTermReportsParams{
		RegionID: region, SchoolID: school, MinYear: int32(TodayInMalawi().Year() - trendYears + 1),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to read term reports: %w", err)
	}
	var terms []termResult
	for _, row := range reports {
		var details schema.TermReportDetails
		if err := json.Unmarshal(row.Details, &details); err != nil {
			return nil, fmt.Errorf("failed to read term report: %w", err)
		}
		terms = append(terms, termResult{year: int(row.Year), term: int(row.Term), areaID: int64(row.AreaID), areaName: row.AreaName, details: details})
	}
	// A school also sees its current term so far
	if schoolID > 0 {
		live, err := s.termReports.Current(ctx, schoolID)
		if err != nil && !errors.Is(err, ErrInUse) && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		if live != nil && live.LearnersAssessed > 0 {
			terms = append(terms, termResult{year: live.Year, term: live.Term, details: *live.Details, live: true})
		}
	}
	out.Performance = summarisePerformance(terms)
	return out, nil
}

// termResult is one school's report for one term.
type termResult struct {
	year, term int
	areaID     int64
	areaName   string
	details    schema.TermReportDetails
	live       bool
}

type tally struct{ learners, passed int }

func (t tally) rate() *float64 { return ratio(t.passed, t.learners) }

// summarisePerformance adds up schools' term reports (in term order) into one figure
// per term, and breaks the newest term down by form, subject and area.
func summarisePerformance(results []termResult) schema.PerformanceTrend {
	trend := schema.PerformanceTrend{
		Terms: []schema.TermPerformance{}, Forms: []schema.FormStats{},
		Subjects: []schema.SubjectStats{}, Areas: []schema.AreaPerformance{},
	}
	type termTotals struct {
		perf          schema.TermPerformance
		all, jce, msc tally
		marks, sum    float64
	}
	var order []*termTotals
	byKey := map[[2]int]*termTotals{}
	for _, r := range results {
		key := [2]int{r.year, r.term}
		t := byKey[key]
		if t == nil {
			t = &termTotals{perf: schema.TermPerformance{Year: r.year, Term: r.term}}
			byKey[key] = t
			order = append(order, t)
		}
		t.perf.Schools++
		t.perf.Live = t.perf.Live || r.live
		for _, f := range r.details.Forms {
			t.all.learners += f.Learners
			t.all.passed += f.Passed
			if r.term == 3 && f.Form == 2 {
				t.jce.learners += f.Learners
				t.jce.passed += f.Passed
			}
			if r.term == 3 && f.Form == 4 {
				t.msc.learners += f.Learners
				t.msc.passed += f.Passed
			}
		}
		for _, sub := range r.details.Subjects {
			if sub.AverageMark != nil {
				t.marks += float64(sub.Marks)
				t.sum += *sub.AverageMark * float64(sub.Marks)
			}
		}
	}
	sort.SliceStable(order, func(i, j int) bool {
		if order[i].perf.Year != order[j].perf.Year {
			return order[i].perf.Year < order[j].perf.Year
		}
		return order[i].perf.Term < order[j].perf.Term
	})
	for _, t := range order {
		t.perf.Learners, t.perf.Passed, t.perf.PassRate = t.all.learners, t.all.passed, t.all.rate()
		t.perf.JCEPassRate, t.perf.MSCEPassRate = t.jce.rate(), t.msc.rate()
		if t.marks > 0 {
			avg := t.sum / t.marks
			t.perf.AverageMark = &avg
		}
		trend.Terms = append(trend.Terms, t.perf)
	}

	// The newest term with learners assessed
	var latest *schema.TermPerformance
	for i := len(trend.Terms) - 1; i >= 0; i-- {
		if trend.Terms[i].Learners > 0 {
			latest = &trend.Terms[i]
			break
		}
	}
	if latest == nil {
		return trend
	}
	trend.Latest = latest

	forms := map[int]*schema.FormStats{}
	type subjectTotals struct {
		name             string
		marks            int
		sum, passedMarks float64
	}
	subjects := map[int64]*subjectTotals{}
	areas := map[int64]*schema.AreaPerformance{}
	areaTally := map[int64]*tally{}
	var areaOrder []int64
	for _, r := range results {
		if r.year != latest.Year || r.term != latest.Term {
			continue
		}
		for _, f := range r.details.Forms {
			fs := forms[f.Form]
			if fs == nil {
				fs = &schema.FormStats{Form: f.Form, SubjectsNeeded: f.SubjectsNeeded}
				forms[f.Form] = fs
			}
			fs.Learners += f.Learners
			fs.Passed += f.Passed
		}
		for _, sub := range r.details.Subjects {
			st := subjects[sub.SubjectID]
			if st == nil {
				st = &subjectTotals{name: sub.Name}
				subjects[sub.SubjectID] = st
			}
			if sub.AverageMark != nil {
				st.marks += sub.Marks
				st.sum += *sub.AverageMark * float64(sub.Marks)
			}
			if sub.PassRate != nil {
				st.passedMarks += *sub.PassRate / 100 * float64(sub.Marks)
			}
		}
		if r.areaID != 0 {
			if areas[r.areaID] == nil {
				areas[r.areaID] = &schema.AreaPerformance{ID: r.areaID, Name: r.areaName}
				areaTally[r.areaID] = &tally{}
				areaOrder = append(areaOrder, r.areaID)
			}
			for _, f := range r.details.Forms {
				areaTally[r.areaID].learners += f.Learners
				areaTally[r.areaID].passed += f.Passed
			}
		}
	}
	for form := 1; form <= 4; form++ {
		if f := forms[form]; f != nil {
			f.PassRate = ratio(f.Passed, f.Learners)
			trend.Forms = append(trend.Forms, *f)
		}
	}
	for id, st := range subjects {
		stats := schema.SubjectStats{SubjectID: id, Name: st.name, Marks: st.marks}
		if st.marks > 0 {
			avg, pass := st.sum/float64(st.marks), st.passedMarks/float64(st.marks)*100
			stats.AverageMark, stats.PassRate = &avg, &pass
		}
		trend.Subjects = append(trend.Subjects, stats)
	}
	sort.Slice(trend.Subjects, func(i, j int) bool { return trend.Subjects[i].Name < trend.Subjects[j].Name })
	for _, id := range areaOrder {
		a := areas[id]
		a.Learners, a.PassRate = areaTally[id].learners, areaTally[id].rate()
		trend.Areas = append(trend.Areas, *a)
	}
	sort.Slice(trend.Areas, func(i, j int) bool { return trend.Areas[i].Name < trend.Areas[j].Name })
	return trend
}
