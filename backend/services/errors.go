package services

import "errors"

var ErrInvalidCredentials = errors.New("invalid email and password combination provided")
var ErrNotFound = errors.New("entity or resource not found")

var (
	ErrStudentNotInSchool     = errors.New("student is not enrolled at the sending school")
	ErrTransferSameSchool     = errors.New("a student cannot be transferred to the school they are already in")
	ErrTransferAlreadyPending = errors.New("student already has a pending transfer request")
	ErrTransferWrongSchool    = errors.New("this school is not allowed to perform this action on the transfer")
	ErrTransferInvalidState   = errors.New("transfer is not in a state that allows this action")
)

// ErrMarkNotAllowed means a mark was sent for a student who is not at the school
// or for a subject the student does not take.
var ErrMarkNotAllowed = errors.New("marks can only be recorded for this school's students in subjects they take")

var ErrAcademicYearNotFound = errors.New("academic year not found")
