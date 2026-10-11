package common

import "testing"

func TestNormalizeMalawiPhone(t *testing.T) {
	valid := map[string]string{
		"0991234567":       "+265991234567",
		"0991 234 567":     "+265991234567",
		"+265 99 123 4567": "+265991234567",
		"265881234567":     "+265881234567",
		"(0888) 123-456":   "+265888123456",
		"+265 1 789 123":   "+2651789123",
		"01 789 123":       "+2651789123",
		"":                 "",
		"   ":              "",
	}
	for input, want := range valid {
		got, err := NormalizeMalawiPhone(input)
		if err != nil || got != want {
			t.Errorf("NormalizeMalawiPhone(%q) = %q, %v; want %q", input, got, err, want)
		}
	}

	invalid := []string{"01 234 56", "12345", "0991234567890", "099123456a", "+44 7700 900123", "0591234567"}
	for _, input := range invalid {
		if got, err := NormalizeMalawiPhone(input); err == nil {
			t.Errorf("NormalizeMalawiPhone(%q) = %q, want an error", input, got)
		}
	}
}
