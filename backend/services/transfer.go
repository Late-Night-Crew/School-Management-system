package services

import (
	"context"
	"database/sql"
	"fmt"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

type TransferService interface {
	CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest) (*schema.Transfer, error)
	GetIncomingTransfersRequest(ctx context.Context, req *schema.GetIncomingTransfersRequest) ([]*schema.Transfer, error)
	GetOutgoingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error)
	GetTransferByID(ctx context.Context, transferID int64) (*schema.Transfer, error)
	ApproveTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error)
    FinalizeTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error)
	RejectTransfer(ctx context.Context, transferID int64, reason string) (*schema.Transfer, error)
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

func (s *transferService) CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest) (*schema.Transfer, error) {
	dbTransfer, err := s.queries.CreateTransferRequest(ctx, dbsqlc.CreateTransferRequestParams{
		StudentID:     int32(req.StudentID),
		FromSchool:    int32(req.FromSchoolID),
		ToSchool:      int32(req.ToSchoolID),
		DateInitiated: sql.NullTime{Time: req.DateInitiated, Valid: !req.DateInitiated.IsZero()},
		Reason:        sql.NullString{String: req.Reason, Valid: req.Reason != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer request: %w", err)
	}

	transfer := &schema.Transfer{
		ID:            int64(dbTransfer.ID),
		Status:        dbTransfer.Status.String,
		StudentID:     int64(dbTransfer.StudentID),
		FromSchoolID:  int64(dbTransfer.FromSchool),
		ToSchoolID:    int64(dbTransfer.ToSchool),
		DateInitiated: dbTransfer.DateInitiated.Time.Format("2006-01-02T15:04:05Z"),
		Reason:        dbTransfer.Reason.String,
	}

	return transfer, nil
}

func (s *transferService) GetIncomingTransfersRequest(ctx context.Context, req *schema.GetIncomingTransfersRequest) ([]*schema.Transfer, error) {
	res := make([]*schema.Transfer, 0)
	dbTransfers, err := s.queries.GetTransfersByToSchoolID(ctx, int32(req.ToSchoolID))
	if err != nil {
		return nil, fmt.Errorf("failed to get incoming transfers for school %d: %w", req.ToSchoolID, err)
	}

	for _, dbTransfer := range dbTransfers {
		res = append(res, &schema.Transfer{
			ID:            int64(dbTransfer.ID),
			StudentID:     int64(dbTransfer.StudentID),
			FromSchoolID:  int64(dbTransfer.FromSchool),
			ToSchoolID:    int64(dbTransfer.ToSchool),
			Status:        dbTransfer.Status.String,
			DateInitiated: dbTransfer.DateInitiated.Time.Format("2006-01-02T15:04:05Z"),
			DateAccepted: func() string {
				if dbTransfer.DateAccepted.Valid {
					return dbTransfer.DateAccepted.Time.Format("2006-01-02T15:04:05Z")
				} else {
					return ""
				}
			}(),
			Reason: dbTransfer.Reason.String,
		})
	}

	return res, nil
}

func (s *transferService) GetOutgoingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error) {
    dbTransfers, err := s.queries.GetOutgoingTransfers(ctx, int32(schoolID))
    if err != nil {
        return nil, fmt.Errorf("failed to retrieve outgoing transfers: %w", err)
    }
    transfers := make([]*schema.Transfer, 0, len(dbTransfers))
    for _, dbTransfer := range dbTransfers {
        transfer := &schema.Transfer{
            ID:            int64(dbTransfer.ID),
            StudentID:     int64(dbTransfer.StudentID),
            FromSchoolID:  int64(dbTransfer.FromSchool),
            ToSchoolID:    int64(dbTransfer.ToSchool),
            Status:        dbTransfer.Status.String,
            DateInitiated: dbTransfer.DateInitiated.Time.Format("2006-01-02T15:04:05Z"),
            Reason:        dbTransfer.Reason.String,
            DateAccepted:  func() string { 
                if dbTransfer.DateAccepted.Valid { 
                    return dbTransfer.DateAccepted.Time.Format("2006-01-02T15:04:05Z") 
                } 
                return "" 
            }(),
        }
        transfers = append(transfers, transfer)
    }

    return transfers, nil
}

func (s *transferService) GetTransferByID(ctx context.Context, transferID int64) (*schema.Transfer, error) {
	// Call the sqlc function
	dbTransfer, err := s.queries.GetTransferByID(ctx, int32(transferID))
	if err != nil {
		// sql.ErrNoRows is the common error when a record is not found
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("transfer with ID %d not found", transferID)
		}
		return nil, fmt.Errorf("failed to retrieve transfer by ID: %w", err)
	}
	return &schema.Transfer{
		ID:            int64(dbTransfer.ID),
		StudentID:     int64(dbTransfer.StudentID),
		FromSchoolID:  int64(dbTransfer.FromSchool),
		ToSchoolID:    int64(dbTransfer.ToSchool),
		Status:        dbTransfer.Status.String,
		DateInitiated: dbTransfer.DateInitiated.Time.Format("2006-01-02T15:04:05Z"),
		DateAccepted: func() string {
			if dbTransfer.DateAccepted.Valid {
				return dbTransfer.DateAccepted.Time.Format("2006-01-02T15:04:05Z")
			} else {
				return ""
			}
		}(),
		Reason: dbTransfer.Reason.String,
	}, nil
}

func (s *transferService) ApproveTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error) {
	// 1. Fetch the existing transfer details
	currentTransfer, err := s.queries.GetTransferByID(ctx, int32(transferID))
	if err != nil {
		return nil, fmt.Errorf("transfer ID %d not found: %w", transferID, err)
	}

	// 2. Prepare the parameters for the transaction (ApproveTransfer)
	params := dbsqlc.ApproveTransferParams{
		StudentID:   currentTransfer.StudentID,
		NewSchoolID: currentTransfer.ToSchool,
		TransferID:  int32(transferID),
	}

	// 3. Execute the transactional update
	dbResult, err := s.queries.ApproveTransfer(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to execute transfer approval transaction: %w", err)
	}

	// 4. Return the result (using the minimalist return mapping)
	return &schema.Transfer{
		ID:            int64(dbResult.ID),
		Status:        dbResult.Status.String,
		DateAccepted:  dbResult.DateAccepted.Time.Format("2006-01-02T15:04:05Z"),
		StudentID:     int64(currentTransfer.StudentID),
		FromSchoolID:  int64(currentTransfer.FromSchool),
		ToSchoolID:    int64(currentTransfer.ToSchool),
		DateInitiated: currentTransfer.DateInitiated.Time.Format("2006-01-02T15:04:05Z"),
		Reason:        currentTransfer.Reason.String,
	}, nil
}

func (s *transferService) FinalizeTransfer(ctx context.Context, transferID int64) (*schema.Transfer, error) {
    dbResult, err := s.queries.FinalizeTransfer(ctx, int32(transferID))
    if err != nil {
        return nil, fmt.Errorf("failed to finalize transfer: %w", err)
    }

    // You would typically fetch the full record here for the response
    updatedTransfer, err := s.GetTransferByID(ctx, transferID)
    if err != nil {
        // Log the failure, but return the successful update status
        s.logger.Error("Finalized transfer, but failed to fetch complete record", "transferID", transferID, "error", err)
        return &schema.Transfer{
            ID: int64(dbResult.ID),
            Status: dbResult.Status.String,
        }, nil
    }
    return updatedTransfer, nil
}

func (s *transferService) RejectTransfer(ctx context.Context, transferID int64, reason string) (*schema.Transfer, error) {
    // 1. Prepare parameters for sqlc
    params := dbsqlc.RejectTransferParams{
        ID: int32(transferID),
        RejectionReason: sql.NullString{String: reason, Valid: true},
    }

    // 2. Execute the update
    _, err := s.queries.RejectTransfer(ctx, params)
    if err != nil {
        return nil, fmt.Errorf("failed to execute transfer rejection: %w", err)
    }

    // 3. Fetch the full transfer record for a complete response
    // (This ensures the response contains student_id, schools, etc.)
    rejectedTransfer, err := s.GetTransferByID(ctx, transferID)
    if err != nil {
        // Log error but return status success if possible
        s.logger.Error("Rejected transfer, but failed to fetch complete record", "transferID", transferID, "error", err)
        return nil, fmt.Errorf("transfer rejected, but failed to fetch full response: %w", err)
    }

    return rejectedTransfer, nil
}