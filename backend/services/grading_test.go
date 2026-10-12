package services

import (
	"errors"
	"testing"

	"nsms/schema"
)

func band(grade string, minMark int, isPass bool) schema.GradeBandInput {
	return schema.GradeBandInput{Grade: grade, MinMark: &minMark, IsPass: isPass}
}

func TestNormaliseGradeBandsSortsHighestFirst(t *testing.T) {
	bands, err := normaliseGradeBands([]schema.GradeBandInput{
		band("F", 0, false), band(" A ", 75, true), band("C", 50, true),
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bands[0].Grade != "A" || bands[1].Grade != "C" || bands[2].Grade != "F" {
		t.Fatalf("bands not sorted and trimmed: %+v", bands)
	}
	if got := describeGradeBands(bands); got != "A 75-100, C 50-74, F 0-49 (pass mark 50)" {
		t.Fatalf("unexpected description %q", got)
	}
}

func TestNormaliseGradeBandsRejectsBadScales(t *testing.T) {
	cases := map[string][]schema.GradeBandInput{
		"no band at 0":          {band("A", 50, true), band("F", 10, false)},
		"duplicate grade":       {band("A", 50, true), band("a", 0, false)},
		"duplicate lower bound": {band("A", 50, true), band("B", 50, true), band("F", 0, false)},
		"no pass":               {band("A", 50, false), band("F", 0, false)},
		"no fail":               {band("A", 50, true), band("B", 0, true)},
		"pass below a fail":     {band("A", 80, true), band("B", 60, false), band("C", 40, true), band("F", 0, false)},
		"blank grade":           {band("  ", 50, true), band("F", 0, false)},
	}
	for name, input := range cases {
		if _, err := normaliseGradeBands(input); !errors.Is(err, ErrInvalidGradingScale) {
			t.Errorf("%s: expected ErrInvalidGradingScale, got %v", name, err)
		}
	}
}
