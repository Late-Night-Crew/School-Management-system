package services

import (
	"strings"
	"testing"

	"nsms/schema"
)

func completeForm() *schema.SchoolRequestForm {
	zero, km := 0, 4.5
	return &schema.SchoolRequestForm{
		SchoolName:   "Bangwe OSS",
		DistrictID:   1,
		Location:     schema.LocationUrban,
		Address:      "P.O. Box 1, Bangwe",
		HeadTeacher:  schema.SchoolRequestHeadTeacher{Name: "A Banda", Phone: "+265991234567"},
		VenueType:    schema.VenueHostSchool,
		VenueName:    "Bangwe CDSS",
		Facilitators: []schema.SchoolRequestFacilitator{{Name: "B Phiri"}},
		Coordinator:  schema.SchoolRequestCoordinator{Name: "C Mwale", Email: "c.mwale@oss.mw"},
		Enrolment:    schema.SchoolRequestEnrolment{Form1: &zero, Form2: &zero, Form3: &zero, Form4: &zero},
		DistanceKm:   &km,
		PTAMembers:   []string{"D Tembo"},
	}
}

func TestMissingFieldsCompleteForm(t *testing.T) {
	if missing := missingFields(completeForm()); len(missing) > 0 {
		t.Fatalf("complete form reported missing: %v", missing)
	}
}

func TestMissingFieldsNeedsCoordinatorEmailAndPTA(t *testing.T) {
	form := completeForm()
	form.Coordinator.Email = ""
	form.PTAMembers = nil
	missing := missingFields(form)
	if len(missing) != 2 || !strings.Contains(missing[0], "coordinator's email") || !strings.Contains(missing[1], "PTA") {
		t.Fatalf("expected the coordinator email and PTA members, got %v", missing)
	}
}

func TestMissingFieldsEmptyForm(t *testing.T) {
	missing := missingFields(&schema.SchoolRequestForm{})
	if len(missing) < 10 || missing[0] != "the school name" {
		t.Fatalf("expected the school name first among many, got %v", missing)
	}
}

func TestTidyFormDropsBlankFacilitators(t *testing.T) {
	form := &schema.SchoolRequestForm{
		SchoolName:   "  Bangwe OSS ",
		Facilitators: []schema.SchoolRequestFacilitator{{Name: " "}, {Name: " B Phiri "}, {}},
		PTAMembers:   []string{" D Tembo ", "", "  "},
		Coordinator:  schema.SchoolRequestCoordinator{Email: " C.Mwale@OSS.mw "},
	}
	tidyForm(form)
	if form.SchoolName != "Bangwe OSS" || len(form.Facilitators) != 1 || form.Facilitators[0].Name != "B Phiri" ||
		len(form.PTAMembers) != 1 || form.PTAMembers[0] != "D Tembo" || form.Coordinator.Email != "c.mwale@oss.mw" {
		t.Fatalf("form not tidied: %+v", form)
	}
}
