package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// TransferService manages student transfers between schools.
//
// Lifecycle: the sending school creates a Pending request, the receiving school
// approves it (Accepted, the student moves to the receiving school) or rejects it,
// and the sending school finalizes an Accepted transfer (Completed).
// The *ForSchool methods enforce those per-school roles; the others are for admins.
type TransferService interface {
	CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest) (*schema.Transfer, error)
	GetIncomingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error)
	GetOutgoingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error)
	GetTransferByID(ctx context.Context, transferID int64) (*schema.Transfer, error)
	GetTransferByIDForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error)
	ApproveTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error)
	ApproveTransferForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error)
	FinalizeTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error)
	FinalizeTransferForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error)
	RejectTransfer(ctx context.Context, transferID int64, reason string) (*schema.Transfer, error)
	RejectTransferForSchool(ctx context.Context, transferID int64, schoolID int64, reason string) (*schema.Transfer, error)
}

type transferService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewTransferService(queries *dbsqlc.Queries, logger logging.Logger) TransferService {
	return &transferService{
		queries: queries,
		logger:  logger,
	}
}

const transferTimeFormat = "2006-01-02T15:04:05Z"

func formatNullTime(t sql.NullTime) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(transferTimeFormat)
}

func toTransfer(row dbsqlc.GetTransferByIDRow) *schema.Transfer {
	return &schema.Transfer{
		ID:              int64(row.ID),
		StudentID:       int64(row.StudentID),
		StudentNumber:   row.StudentNumber,
		StudentName:     row.StudentFirstName + " " + row.StudentLastName,
		FromSchoolID:    int64(row.FromSchool),
		FromSchoolName:  row.FromSchoolName,
		ToSchoolID:      int64(row.ToSchool),
		ToSchoolName:    row.ToSchoolName,
		Status:          row.Status.String,
		DateInitiated:   formatNullTime(row.DateInitiated),
		DateAccepted:    formatNullTime(row.DateAccepted),
		Reason:          row.Reason.String,
		RejectionReason: row.RejectionReason.String,
	}
}

func (s *transferService) CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest) (*schema.Transfer, error) {
	if req.FromSchoolID == req.ToSchoolID {
		return nil, ErrTransferSameSchool
	}

	_, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{
		ID:       int32(req.StudentID),
		SchoolID: int32(req.FromSchoolID),
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrStudentNotInSchool
		}
		return nil, fmt.Errorf("failed to look up student %d: %w", req.StudentID, err)
	}

	pending, err := s.queries.CountPendingTransfersForStudent(ctx, int32(req.StudentID))
	if err != nil {
		return nil, fmt.Errorf("failed to check pending transfers for student %d: %w", req.StudentID, err)
	}
	if pending > 0 {
		return nil, ErrTransferAlreadyPending
	}

	dateInitiated := req.DateInitiated
	if dateInitiated.IsZero() {
		dateInitiated = time.Now()
	}

	transferID, err := s.queries.CreateTransferRequest(ctx, dbsqlc.CreateTransferRequestParams{
		StudentID:     int32(req.StudentID),
		FromSchool:    int32(req.FromSchoolID),
		ToSchool:      int32(req.ToSchoolID),
		DateInitiated: sql.NullTime{Time: dateInitiated, Valid: true},
		Reason:        sql.NullString{String: req.Reason, Valid: req.Reason != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer request: %w", err)
	}

	return s.GetTransferByID(ctx, int64(transferID))
}

func (s *transferService) GetIncomingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error) {
	rows, err := s.queries.GetTransfersByToSchoolID(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to get incoming transfers for school %d: %w", schoolID, err)
	}
	transfers := make([]*schema.Transfer, 0, len(rows))
	for _, row := range rows {
		transfers = append(transfers, toTransfer(dbsqlc.GetTransferByIDRow(row)))
	}
	return transfers, nil
}

func (s *transferService) GetOutgoingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error) {
	rows, err := s.queries.GetOutgoingTransfers(ctx, int32(schoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to get outgoing transfers for school %d: %w", schoolID, err)
	}
	transfers := make([]*schema.Transfer, 0, len(rows))
	for _, row := range rows {
		transfers = append(transfers, toTransfer(dbsqlc.GetTransferByIDRow(row)))
	}
	return transfers, nil
}

func (s *transferService) GetTransferByID(ctx context.Context, transferID int64) (*schema.Transfer, error) {
	row, err := s.queries.GetTransferByID(ctx, int32(transferID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get transfer %d: %w", transferID, err)
	}
	return toTransfer(row), nil
}

// GetTransferByIDForSchool returns the transfer only if the school is its sender or receiver.
func (s *transferService) GetTransferByIDForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error) {
	transfer, err := s.GetTransferByID(ctx, transferID)
	if err != nil {
		return nil, err
	}
	if transfer.FromSchoolID != schoolID && transfer.ToSchoolID != schoolID {
		return nil, ErrNotFound
	}
	return transfer, nil
}

func (s *transferService) ApproveTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error) {
	_, err := s.queries.ApproveTransfer(ctx, int32(transferID))
	return s.afterAction(ctx, err, transferID, 0, false)
}

func (s *transferService) ApproveTransferForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error) {
	_, err := s.queries.ApproveTransferForSchool(ctx, dbsqlc.ApproveTransferForSchoolParams{
		TransferID: int32(transferID),
		SchoolID:   int32(schoolID),
	})
	return s.afterAction(ctx, err, transferID, schoolID, false)
}

func (s *transferService) FinalizeTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error) {
	_, err := s.queries.FinalizeTransfer(ctx, int32(transferID))
	return s.afterAction(ctx, err, transferID, 0, true)
}

func (s *transferService) FinalizeTransferForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error) {
	_, err := s.queries.FinalizeTransferForSchool(ctx, dbsqlc.FinalizeTransferForSchoolParams{
		TransferID: int32(transferID),
		SchoolID:   int32(schoolID),
	})
	return s.afterAction(ctx, err, transferID, schoolID, true)
}

func (s *transferService) RejectTransfer(ctx context.Context, transferID int64, reason string) (*schema.Transfer, error) {
	_, err := s.queries.RejectTransfer(ctx, dbsqlc.RejectTransferParams{
		TransferID:      int32(transferID),
		RejectionReason: sql.NullString{String: reason, Valid: true},
	})
	return s.afterAction(ctx, err, transferID, 0, false)
}

func (s *transferService) RejectTransferForSchool(ctx context.Context, transferID int64, schoolID int64, reason string) (*schema.Transfer, error) {
	_, err := s.queries.RejectTransferForSchool(ctx, dbsqlc.RejectTransferForSchoolParams{
		TransferID:      int32(transferID),
		SchoolID:        int32(schoolID),
		RejectionReason: sql.NullString{String: reason, Valid: true},
	})
	return s.afterAction(ctx, err, transferID, schoolID, false)
}

// afterAction turns the result of a guarded status update into a response.
// The update queries match no rows when the transfer is missing, belongs to another
// school, or is in the wrong status; in that case the transfer is reloaded to report
// which one it was. schoolID is 0 for admin actions. senderAction is true when the
// sending school performs the action (finalize) and false for the receiving school.
func (s *transferService) afterAction(ctx context.Context, err error, transferID int64, schoolID int64, senderAction bool) (*schema.Transfer, error) {
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to update transfer %d: %w", transferID, err)
	}

	transfer, getErr := s.GetTransferByID(ctx, transferID)
	if getErr != nil {
		return nil, getErr
	}
	if err == nil {
		return transfer, nil
	}

	if schoolID != 0 {
		if transfer.FromSchoolID != schoolID && transfer.ToSchoolID != schoolID {
			return nil, ErrNotFound
		}
		allowedSchoolID := transfer.ToSchoolID
		if senderAction {
			allowedSchoolID = transfer.FromSchoolID
		}
		if schoolID != allowedSchoolID {
			return nil, ErrTransferWrongSchool
		}
	}
	return nil, ErrTransferInvalidState
}
