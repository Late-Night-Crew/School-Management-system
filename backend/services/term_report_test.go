package services

import (
	"testing"

	"nsms/database/dbsqlc"
)

const english, maths, science int64 = 1, 2, 3

func testRules() passRules {
	return passRules{
		passMark:   40,
		needed:     map[int]int{1: 2, 2: 2, 3: 2, 4: 2},
		compulsory: map[int]map[int64]bool{2: {english: true}, 4: {english: true}},
	}
}

func TestPassesNeedsCompulsoryForExamForms(t *testing.T) {
	rules := testRules()
	failedEnglish := map[int64]int{english: 30, maths: 80, science: 70}
	if passed, _ := rules.passes(1, failedEnglish); !passed {
		t.Error("Form 1 should pass on two subjects; English is not compulsory there")
	}
	if passed, missed := rules.passes(2, failedEnglish); passed || !missed {
		t.Error("Form 2 (JCE) must fail without English")
	}
	if passed, _ := rules.passes(4, map[int64]int{english: 50, maths: 45}); !passed {
		t.Error("Form 4 (MSCE) with English and one more subject should pass")
	}
}

func mark(student int32, subject int64, value, form int) dbsqlc.ListTermMarksRow {
	return dbsqlc.ListTermMarksRow{StudentID: student, SubjectID: int32(subject), SubjectName: map[int64]string{1: "English", 2: "Maths", 3: "Science"}[subject], Mark: int32(value), FormLevel: int32(form)}
}

func TestComputeTermReport(t *testing.T) {
	marks := []dbsqlc.ListTermMarksRow{
		mark(1, english, 60, 2), mark(1, maths, 50, 2), // passes JCE
		mark(2, english, 20, 2), mark(2, maths, 90, 2), mark(2, science, 90, 2), // fails JCE (English)
		mark(3, maths, 70, 4), mark(3, english, 40, 4), // passes MSCE
	}
	f := computeTermReport(marks, 3, testRules())
	if f.learners != 3 || f.jce == nil || *f.jce != 50 || f.msce == nil || *f.msce != 100 {
		t.Fatalf("unexpected figures: learners %d jce %v msce %v", f.learners, f.jce, f.msce)
	}
	if f.passRate == nil || int(*f.passRate) != 66 {
		t.Errorf("overall pass rate = %v, want 66.7", f.passRate)
	}
	if len(f.details.Subjects) != 3 || f.details.Subjects[0].Name != "English" {
		t.Errorf("subjects not listed by name: %+v", f.details.Subjects)
	}
	if again := computeTermReport(marks, 3, testRules()); again.fingerprint != f.fingerprint {
		t.Error("the same marks must give the same fingerprint")
	}
	changed := append([]dbsqlc.ListTermMarksRow{}, marks...)
	changed[0].Mark = 61
	if computeTermReport(changed, 3, testRules()).fingerprint == f.fingerprint {
		t.Error("a changed mark must change the fingerprint")
	}
	if term1 := computeTermReport(marks, 1, testRules()); term1.jce != nil || term1.msce != nil {
		t.Error("JCE and MSCE rates only come from Term 3")
	}
}
