package services

import (
	"errors"
	"fmt"
	"strings"
)

var ErrInvalidCredentials = errors.New("invalid email and password combination provided")
var ErrNotFound = errors.New("entity or resource not found")

var (
	ErrStudentNotInSchool     = errors.New("student is not enrolled at the sending school")
	ErrTransferSameSchool     = errors.New("a student cannot be transferred to the school they are already in")
	ErrTransferAlreadyPending = errors.New("student already has a pending transfer request")
	ErrTransferWrongSchool    = errors.New("this school is not allowed to perform this action on the transfer")
	ErrTransferInvalidState   = errors.New("transfer is not in a state that allows this action")
	ErrTransferTargetMissing  = errors.New("the receiving school does not exist")
	ErrStudentNotActive       = errors.New("only current learners can be transferred; this learner has left or finished school")
)

// ErrMarkNotAllowed means a mark was sent for a student who is not at the school
// or for a subject the student does not take.
var ErrMarkNotAllowed = errors.New("marks can only be recorded for this school's students in subjects they take")

var ErrAcademicYearNotFound = errors.New("academic year not found")

// ErrInUse means a school, district or division still has records that a delete, move
// or close would lose or strand. Errors of this kind carry a message for the user.
var ErrInUse = errors.New("in use")

// ErrInvalidMove means a move's target is not usable (the same place, or missing).
var ErrInvalidMove = errors.New("invalid move")

// ErrSchoolClosed means a closed school was given new students, transfers or accounts.
var ErrSchoolClosed = errors.New("this school is closed and cannot take new students, transfers or accounts")

// userError is an error of a given kind whose message is shown to the user as is.
type userError struct {
	kind error
	msg  string
}

func (e userError) Error() string { return e.msg }
func (e userError) Unwrap() error { return e.kind }

func newUserError(kind error, format string, args ...any) error {
	return userError{kind: kind, msg: fmt.Sprintf(format, args...)}
}

// countOf gives "1 student" or "3 students".
func countOf(n int, noun string) string {
	if n == 1 {
		return fmt.Sprintf("1 %s", noun)
	}
	return fmt.Sprintf("%d %ss", n, noun)
}

// pickVerb gives singular for 1 and plural otherwise, e.g. pickVerb(n, "is", "are").
func pickVerb(n int, singular, plural string) string {
	if n == 1 {
		return singular
	}
	return plural
}

// joinList gives "a", "a and b" or "a, b and c".
func joinList(items []string) string {
	if len(items) < 2 {
		return strings.Join(items, "")
	}
	return strings.Join(items[:len(items)-1], ", ") + " and " + items[len(items)-1]
}
