package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/schema"
)

// Learners who leave (see migration 29): marked Withdrawn or DroppedOut with the date and
// an optional reason, and reinstated if they come back. schoolID limits the change to
// that school's learners (a coordinator); 0 allows any learner (MCDE).

// ErrLearnerStatus wraps why a learner's status cannot change; the message is for the user.
var ErrLearnerStatus = errors.New("learner status cannot change")

func markLearnerLeft(ctx context.Context, queries *dbsqlc.Queries, actorID, schoolID, studentID int64, req *schema.LeaveRequest) error {
	state, err := queries.GetLearnerState(ctx, int32(studentID))
	if errors.Is(err, sql.ErrNoRows) || (err == nil && schoolID > 0 && int64(state.SchoolID) != schoolID) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up learner %d: %w", studentID, err)
	}
	if state.Status != schema.StudentActive {
		return newUserError(ErrLearnerStatus, "Only a current learner can be marked as having left (this learner is %s).", describeStatus(state.Status))
	}
	if state.TransferOpen {
		return newUserError(ErrLearnerStatus, "This learner has a transfer in progress. Finish or reject it first.")
	}
	leftOn := TodayInMalawi()
	if req.LeftOn != "" {
		leftOn, _ = time.Parse(time.DateOnly, req.LeftOn)
		if leftOn.After(TodayInMalawi()) {
			return newUserError(ErrLearnerStatus, "The date the learner left cannot be in the future.")
		}
	}
	var school sql.NullInt32
	if schoolID > 0 {
		school = nullID(schoolID)
	}
	_, err = queries.SetLearnerLeft(ctx, dbsqlc.SetLearnerLeftParams{
		Status: req.Status, LeftOn: leftOn, Reason: common.NullString(strings.TrimSpace(req.Reason)),
		StudentID: int32(studentID), SchoolID: school, ActorUserID: int32(actorID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return newUserError(ErrLearnerStatus, "This learner's status has just changed; reload and try again.")
	}
	if err != nil {
		return fmt.Errorf("failed to mark learner %d as left: %w", studentID, err)
	}
	return nil
}

func reinstateLearner(ctx context.Context, queries *dbsqlc.Queries, actorID, schoolID, studentID int64) error {
	state, err := queries.GetLearnerState(ctx, int32(studentID))
	if errors.Is(err, sql.ErrNoRows) || (err == nil && schoolID > 0 && int64(state.SchoolID) != schoolID) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up learner %d: %w", studentID, err)
	}
	if state.Status != schema.StudentWithdrawn && state.Status != schema.StudentDroppedOut {
		return newUserError(ErrLearnerStatus, "Only a learner who has left can be reinstated (this learner is %s).", describeStatus(state.Status))
	}
	if err := checkSchoolOpen(ctx, queries, int64(state.SchoolID)); err != nil {
		if errors.Is(err, ErrSchoolClosed) {
			return newUserError(ErrLearnerStatus, "The learner's school is closed. Register them at their new school instead.")
		}
		return err
	}
	var school sql.NullInt32
	if schoolID > 0 {
		school = nullID(schoolID)
	}
	if _, err := queries.ReinstateLearner(ctx, dbsqlc.ReinstateLearnerParams{StudentID: int32(studentID), SchoolID: school, ActorUserID: int32(actorID)}); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return newUserError(ErrLearnerStatus, "This learner's status has just changed; reload and try again.")
		}
		return fmt.Errorf("failed to reinstate learner %d: %w", studentID, err)
	}
	return nil
}

func describeStatus(status string) string {
	switch status {
	case schema.StudentDroppedOut:
		return "marked as dropped out"
	case schema.StudentWithdrawn:
		return "withdrawn"
	case "Completed":
		return "finished Form 4"
	}
	return strings.ToLower(status)
}

// deleteLearner removes a learner registered by mistake (schoolID 0: any school). A
// learner with marks, year-end results or transfers has a history that counts in
// reports, so they are marked as having left instead. Every delete is audited.
func deleteLearner(ctx context.Context, queries *dbsqlc.Queries, schoolID, studentID int64) error {
	learner, err := queries.GetLearnerForDelete(ctx, dbsqlc.GetLearnerForDeleteParams{StudentID: int32(studentID), SchoolID: optionalID(schoolID)})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up learner %d: %w", studentID, err)
	}
	if learner.Marks > 0 || learner.Results > 0 || learner.Transfers > 0 {
		return newUserError(ErrInUse, "%s %s has marks, results or transfers, so deleting them would change the school's records. Mark them as having left instead.",
			learner.FirstName, learner.LastName)
	}
	if err := queries.DeleteStudent(ctx, int32(studentID)); err != nil {
		return fmt.Errorf("failed to delete learner %d: %w", studentID, err)
	}
	return recordAudit(ctx, queries, "student", studentID, "Deleted",
		fmt.Sprintf("%s %s (%s) at %s, registered by mistake", learner.FirstName, learner.LastName, learner.StudentNumber, learner.SchoolName))
}

// learnerChanges describes what an edit changed in the fields that count in reports.
func learnerChanges(beforeForm, afterForm int, beforeSchool, afterSchool string) string {
	var changes []string
	if beforeForm != afterForm {
		changes = append(changes, fmt.Sprintf("Form %d to Form %d", beforeForm, afterForm))
	}
	if beforeSchool != afterSchool {
		changes = append(changes, fmt.Sprintf("school %s to %s", beforeSchool, afterSchool))
	}
	return strings.Join(changes, "; ")
}
