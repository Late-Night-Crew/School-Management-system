package services

import "testing"

func TestNormaliseLearnerID(t *testing.T) {
	for in, want := range map[string]string{" ab12 cd34 ": "AB12CD34", "jce/2026-01": "JCE/2026-01", "": ""} {
		if got := normaliseLearnerID(in); got != want {
			t.Errorf("normaliseLearnerID(%q) = %q, want %q", in, got, want)
		}
	}
	if !nationalIDPattern.MatchString("AB12CD34") || nationalIDPattern.MatchString("AB-12CD3") || nationalIDPattern.MatchString("AB12CD345") {
		t.Error("national ID pattern accepts or rejects the wrong values")
	}
	if !jceNumberPattern.MatchString("JCE/2026-01") || jceNumberPattern.MatchString("J") {
		t.Error("JCE number pattern accepts or rejects the wrong values")
	}
}

func TestLastDigits(t *testing.T) {
	if lastDigits("0999 000 111", 9) != lastDigits("+265999000111", 9) || lastDigits("12", 9) != "12" {
		t.Error("lastDigits does not match the same number in different formats")
	}
}
