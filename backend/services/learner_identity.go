package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/schema"
)

// Telling learners apart. Two learners can share a name, so a learner may carry a
// National ID and (from Form 2) a JCE number; each must be unique when given. Learners
// without them are compared by name plus date of birth or guardian phone, which only
// warns: it cannot be sure two records are the same person.

var (
	// ErrDuplicateLearner means the National ID or JCE number belongs to another learner.
	ErrDuplicateLearner = errors.New("learner already registered")
	// ErrInvalidLearnerID means a National ID or JCE number is not in a usable form.
	ErrInvalidLearnerID = errors.New("invalid learner ID")
)

var (
	// Malawi National IDs are 8 letters and numbers
	nationalIDPattern = regexp.MustCompile(`^[A-Z0-9]{8}$`)
	jceNumberPattern  = regexp.MustCompile(`^[A-Z0-9/-]{3,30}$`)
)

// normaliseLearnerID upper-cases an ID and removes spaces, so "ab12 cd34" and "AB12CD34"
// are the same ID.
func normaliseLearnerID(value string) string {
	return strings.ToUpper(strings.Join(strings.Fields(value), ""))
}

// prepareLearnerIdentity tidies a learner's National ID and JCE number in place and
// checks no other learner (other than excludeID) already holds them.
func prepareLearnerIdentity(ctx context.Context, queries *dbsqlc.Queries, nationalID, jceNumber *string, excludeID int64) error {
	*nationalID = normaliseLearnerID(*nationalID)
	*jceNumber = normaliseLearnerID(*jceNumber)
	if *nationalID != "" && !nationalIDPattern.MatchString(*nationalID) {
		return newUserError(ErrInvalidLearnerID, "A National ID is 8 letters and numbers, e.g. AB12CD34.")
	}
	if *jceNumber != "" && !jceNumberPattern.MatchString(*jceNumber) {
		return newUserError(ErrInvalidLearnerID, "The JCE number should be letters, numbers, / or - (3 to 30 characters).")
	}
	if *nationalID != "" {
		other, err := queries.FindStudentByNationalID(ctx, dbsqlc.FindStudentByNationalIDParams{NationalID: *nationalID, ExcludeID: int32(excludeID)})
		if err == nil {
			return newUserError(ErrDuplicateLearner, "National ID %s is already recorded for %s %s (%s) at %s.",
				*nationalID, other.FirstName, other.LastName, other.StudentNumber, schoolOrUnknown(other.SchoolName))
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("failed to check national ID: %w", err)
		}
	}
	if *jceNumber != "" {
		other, err := queries.FindStudentByJCENumber(ctx, dbsqlc.FindStudentByJCENumberParams{JceNumber: *jceNumber, ExcludeID: int32(excludeID)})
		if err == nil {
			return newUserError(ErrDuplicateLearner, "JCE number %s is already recorded for %s %s (%s) at %s.",
				*jceNumber, other.FirstName, other.LastName, other.StudentNumber, schoolOrUnknown(other.SchoolName))
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("failed to check JCE number: %w", err)
		}
	}
	return nil
}

func schoolOrUnknown(name string) string {
	if name == "" {
		return "an unknown school"
	}
	return name
}

// FindSimilarLearners lists learners who may be the person being registered: same
// first and last name and the same date of birth or guardian phone. The screens show
// these as a warning before saving.
func FindSimilarLearners(ctx context.Context, queries *dbsqlc.Queries, check *schema.DuplicateCheckRequest) ([]schema.SimilarLearner, error) {
	first, last := strings.TrimSpace(check.FirstName), strings.TrimSpace(check.LastName)
	similar := []schema.SimilarLearner{}
	if first == "" || last == "" {
		return similar, nil
	}
	params := dbsqlc.ListPossibleDuplicateStudentsParams{FirstName: first, LastName: last, ExcludeID: int32(check.ExcludeID)}
	if dob := common.StringToNullTime(strings.TrimSpace(check.DateOfBirth)); dob.Valid {
		params.DateOfBirth = dob
	}
	// Too few digits to compare reliably
	if phone := strings.TrimSpace(check.GuardianPhone); len(lastDigits(phone, 9)) == 9 {
		params.GuardianPhone = common.NullString(phone)
	}
	if !params.DateOfBirth.Valid && !params.GuardianPhone.Valid {
		return similar, nil
	}
	rows, err := queries.ListPossibleDuplicateStudents(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to look for similar learners: %w", err)
	}
	for _, row := range rows {
		var reasons []string
		if params.DateOfBirth.Valid && row.DateOfBirth.Valid && row.DateOfBirth.Time.Equal(params.DateOfBirth.Time) {
			reasons = append(reasons, "same date of birth")
		}
		if params.GuardianPhone.Valid && lastDigits(row.GuardianPhone.String, 9) == lastDigits(params.GuardianPhone.String, 9) {
			reasons = append(reasons, "same guardian phone")
		}
		similar = append(similar, schema.SimilarLearner{
			ID:            int64(row.ID),
			Name:          strings.TrimSpace(row.FirstName + " " + row.LastName),
			StudentNumber: row.StudentNumber,
			SchoolName:    row.SchoolName,
			FormLevel:     int(row.FormLevel.Int32),
			HasNationalID: row.NationalID.Valid && row.NationalID.String != "",
			Reason:        "Same name, " + strings.Join(reasons, " and "),
		})
	}
	return similar, nil
}

// lastDigits keeps the digits of a phone number and returns the last n, so the same
// number typed as 0991..., +265 991... or 991... compares equal.
func lastDigits(phone string, n int) string {
	digits := make([]rune, 0, len(phone))
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits = append(digits, r)
		}
	}
	if len(digits) > n {
		digits = digits[len(digits)-n:]
	}
	return string(digits)
}
