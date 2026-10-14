package services

import (
	"reflect"
	"testing"

	"nsms/schema"
)

func TestYearEndOptions(t *testing.T) {
	cases := []struct {
		form        int
		passed      bool
		recommended string
		allowed     []string
	}{
		{1, true, schema.OutcomePromoted, []string{schema.OutcomePromoted}},
		{1, false, schema.OutcomeRepeat, []string{schema.OutcomeRepeat, schema.OutcomeProceeded}},
		{2, true, schema.OutcomePromoted, []string{schema.OutcomePromoted}},
		{2, false, schema.OutcomeRepeat, []string{schema.OutcomeRepeat}}, // failed JCE: no proceeding
		{3, false, schema.OutcomeRepeat, []string{schema.OutcomeRepeat, schema.OutcomeProceeded}},
		{4, true, schema.OutcomeCompleted, []string{schema.OutcomeCompleted}},
		{4, false, schema.OutcomeRewrite, []string{schema.OutcomeRewrite}}, // failed national exams: rewrite
	}
	for _, c := range cases {
		recommended, allowed := yearEndOptions(c.form, c.passed)
		if recommended != c.recommended || !reflect.DeepEqual(allowed, c.allowed) {
			t.Errorf("Form %d passed=%v: got %s %v, want %s %v", c.form, c.passed, recommended, allowed, c.recommended, c.allowed)
		}
	}
}

func TestFormAfter(t *testing.T) {
	for _, c := range []struct {
		form    int
		outcome string
		want    int
	}{
		{1, schema.OutcomePromoted, 2}, {1, schema.OutcomeProceeded, 2}, {2, schema.OutcomeRepeat, 2},
		{4, schema.OutcomeCompleted, 4}, {4, schema.OutcomeRewrite, 4},
	} {
		if got := formAfter(c.form, c.outcome); got != c.want {
			t.Errorf("formAfter(%d, %s) = %d, want %d", c.form, c.outcome, got, c.want)
		}
	}
}
