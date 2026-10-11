package common

import (
	"errors"
	"strings"
)

var ErrInvalidPhone = errors.New("enter a Malawi phone number, e.g. 0991 234 567 or +265 1 234 567")

// NormalizeMalawiPhone turns a typed Malawi number into international form,
// e.g. "0991 234 567", "265991234567" or "+265 99 123 4567" -> "+265991234567".
// Mobile numbers have 9 digits after the country code (starting 7, 8 or 9) and
// landlines 7 (starting 1). An empty value stays empty.
func NormalizeMalawiPhone(value string) (string, error) {
	digits := strings.Map(func(r rune) rune {
		switch {
		case r >= '0' && r <= '9':
			return r
		case r == ' ' || r == '-' || r == '(' || r == ')' || r == '.' || r == '+':
			return -1
		default:
			return 'x' // any other character makes the number invalid
		}
	}, strings.TrimSpace(value))
	if digits == "" {
		return "", nil
	}

	switch {
	case strings.HasPrefix(digits, "265"):
		digits = digits[3:]
	case strings.HasPrefix(digits, "0"):
		digits = digits[1:]
	}
	if strings.ContainsRune(digits, 'x') {
		return "", ErrInvalidPhone
	}
	mobile := len(digits) == 9 && strings.ContainsRune("789", rune(digits[0]))
	landline := len(digits) == 7 && digits[0] == '1'
	if !mobile && !landline {
		return "", ErrInvalidPhone
	}
	return "+265" + digits, nil
}
