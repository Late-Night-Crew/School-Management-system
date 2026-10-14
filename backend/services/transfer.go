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
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/schema"
)

// TransferService manages student transfers between schools.
//
// Lifecycle: the sending school creates a Pending request, the receiving school
// approves it (Accepted, the student moves to the receiving school) or rejects it,
// and the sending school finalizes an Accepted transfer (Completed).
// The *ForSchool methods enforce those per-school roles; the others are for admins.
//
// actorID is the user performing the action. Each action records an audit entry
// with the actor and note in the same statement as the status change.
type TransferService interface {
	CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest, actorID int64) (*schema.Transfer, error)
	GetIncomingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error)
	GetOutgoingTransfers(ctx context.Context, schoolID int64) ([]*schema.Transfer, error)
	GetTransferByID(ctx context.Context, transferID int64) (*schema.Transfer, error)
	GetTransferByIDForSchool(ctx context.Context, transferID int64, schoolID int64) (*schema.Transfer, error)
	ApproveTransfer(ctx context.Context, transferID int64, actorID int64, note string) (*schema.Transfer, error)
	ApproveTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64) (*schema.Transfer, error)
	FinalizeTransfer(ctx context.Context, transferID int64, actorID int64, note string) (*schema.Transfer, error)
	FinalizeTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64) (*schema.Transfer, error)
	RejectTransfer(ctx context.Context, transferID int64, actorID int64, reason string) (*schema.Transfer, error)
	RejectTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64, reason string) (*schema.Transfer, error)

	// ListTransferHistory returns one page of all transfers matching the filter.
	ListTransferHistory(ctx context.Context, filter *schema.TransferHistoryFilter) (*schema.TransferHistoryPage, error)
	// ExportTransferHistory returns every transfer matching the filter (ignoring paging)
	// and records the export in the audit log.
	ExportTransferHistory(ctx context.Context, filter *schema.TransferHistoryFilter, actorID int64) ([]*schema.TransferHistoryItem, error)
	GetTransferAuditLog(ctx context.Context, transferID int64) ([]*schema.TransferAuditEntry, error)
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

func (s *transferService) CreateTransferRequest(ctx context.Context, req *schema.CreateTransferRequest, actorID int64) (*schema.Transfer, error) {
	if req.FromSchoolID == req.ToSchoolID {
		return nil, ErrTransferSameSchool
	}
	if err := checkSchoolOpen(ctx, s.queries, req.ToSchoolID); err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, ErrTransferTargetMissing
		}
		return nil, err
	}

	student, err := s.queries.GetStudentByIDAndSchoolID(ctx, dbsqlc.GetStudentByIDAndSchoolIDParams{
		ID:       int32(req.StudentID),
		SchoolID: int32(req.FromSchoolID),
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrStudentNotInSchool
		}
		return nil, fmt.Errorf("failed to look up student %d: %w", req.StudentID, err)
	}
	if student.Status != schema.StudentActive {
		return nil, ErrStudentNotActive
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
	if dateInitiated.After(TodayInMalawi().AddDate(0, 0, 1)) {
		return nil, ErrTransferFutureDate
	}

	transferID, err := s.queries.CreateTransferRequest(ctx, dbsqlc.CreateTransferRequestParams{
		StudentID:     int32(req.StudentID),
		FromSchool:    int32(req.FromSchoolID),
		ToSchool:      int32(req.ToSchoolID),
		DateInitiated: sql.NullTime{Time: dateInitiated, Valid: true},
		Reason:        sql.NullString{String: req.Reason, Valid: req.Reason != ""},
		ActorUserID:   int32(actorID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create transfer request: %w", err)
	}

	transfer, err := s.GetTransferByID(ctx, int64(transferID))
	return s.notifySchools(ctx, transfer, err, schema.TransferActionCreated, false)
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

func (s *transferService) ApproveTransfer(ctx context.Context, transferID int64, actorID int64, note string) (*schema.Transfer, error) {
	_, err := s.queries.ApproveTransfer(ctx, dbsqlc.ApproveTransferParams{
		TransferID:  int32(transferID),
		ActorUserID: int32(actorID),
		Note:        common.NullString(note),
	})
	transfer, err := s.afterAction(ctx, err, transferID, 0, false)
	err = s.whyNotApproved(ctx, transferID, err)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionApproved, true)
}

func (s *transferService) ApproveTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64) (*schema.Transfer, error) {
	_, err := s.queries.ApproveTransferForSchool(ctx, dbsqlc.ApproveTransferForSchoolParams{
		TransferID:  int32(transferID),
		SchoolID:    int32(schoolID),
		ActorUserID: int32(actorID),
	})
	transfer, err := s.afterAction(ctx, err, transferID, schoolID, false)
	err = s.whyNotApproved(ctx, transferID, err)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionApproved, false)
}

func (s *transferService) FinalizeTransfer(ctx context.Context, transferID int64, actorID int64, note string) (*schema.Transfer, error) {
	_, err := s.queries.FinalizeTransfer(ctx, dbsqlc.FinalizeTransferParams{
		TransferID:  int32(transferID),
		ActorUserID: int32(actorID),
		Note:        common.NullString(note),
	})
	transfer, err := s.afterAction(ctx, err, transferID, 0, true)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionCompleted, true)
}

func (s *transferService) FinalizeTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64) (*schema.Transfer, error) {
	_, err := s.queries.FinalizeTransferForSchool(ctx, dbsqlc.FinalizeTransferForSchoolParams{
		TransferID:  int32(transferID),
		SchoolID:    int32(schoolID),
		ActorUserID: int32(actorID),
	})
	transfer, err := s.afterAction(ctx, err, transferID, schoolID, true)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionCompleted, false)
}

func (s *transferService) RejectTransfer(ctx context.Context, transferID int64, actorID int64, reason string) (*schema.Transfer, error) {
	_, err := s.queries.RejectTransfer(ctx, dbsqlc.RejectTransferParams{
		TransferID:      int32(transferID),
		RejectionReason: sql.NullString{String: reason, Valid: true},
		ActorUserID:     int32(actorID),
	})
	transfer, err := s.afterAction(ctx, err, transferID, 0, false)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionRejected, true)
}

func (s *transferService) RejectTransferForSchool(ctx context.Context, transferID int64, schoolID int64, actorID int64, reason string) (*schema.Transfer, error) {
	_, err := s.queries.RejectTransferForSchool(ctx, dbsqlc.RejectTransferForSchoolParams{
		TransferID:      int32(transferID),
		SchoolID:        int32(schoolID),
		RejectionReason: sql.NullString{String: reason, Valid: true},
		ActorUserID:     int32(actorID),
	})
	transfer, err := s.afterAction(ctx, err, transferID, schoolID, false)
	return s.notifySchools(ctx, transfer, err, schema.TransferActionRejected, false)
}

const (
	defaultHistoryPageSize = 25
	auditEntityTransfer    = "transfer"
)

func (s *transferService) ListTransferHistory(ctx context.Context, filter *schema.TransferHistoryFilter) (*schema.TransferHistoryPage, error) {
	page := max(filter.Page, 1)
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = defaultHistoryPageSize
	}

	params := historyParams(filter)
	params.RowLimit = sql.NullInt32{Int32: int32(pageSize), Valid: true}
	params.RowOffset = int32((page - 1) * pageSize)
	rows, err := s.queries.ListTransfersForAdmin(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to list transfer history: %w", err)
	}

	counts, err := s.queries.CountTransfersByStatusForAdmin(ctx, dbsqlc.CountTransfersByStatusForAdminParams{
		RegionID:   params.RegionID,
		DistrictID: params.DistrictID,
		SchoolID:   params.SchoolID,
		DateFrom:   params.DateFrom,
		DateTo:     params.DateTo,
		Search:     params.Search,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count transfer history: %w", err)
	}

	result := &schema.TransferHistoryPage{
		Items:        toHistoryItems(rows),
		Page:         page,
		PageSize:     pageSize,
		StatusCounts: map[string]int64{},
	}
	for _, status := range []string{schema.TransferStatusPending, schema.TransferStatusAccepted, schema.TransferStatusCompleted, schema.TransferStatusRejected} {
		result.StatusCounts[status] = 0
	}
	for _, row := range counts {
		result.StatusCounts[row.Status.String] = row.Count
	}
	if len(rows) > 0 {
		result.Total = rows[0].TotalCount
	} else if page > 1 {
		// Past the last page the window count is unavailable, so fall back to the status totals
		for status, count := range result.StatusCounts {
			if filter.Status == "" || filter.Status == status {
				result.Total += count
			}
		}
	}
	return result, nil
}

func (s *transferService) ExportTransferHistory(ctx context.Context, filter *schema.TransferHistoryFilter, actorID int64) ([]*schema.TransferHistoryItem, error) {
	rows, err := s.queries.ListTransfersForAdmin(ctx, historyParams(filter))
	if err != nil {
		return nil, fmt.Errorf("failed to export transfer history: %w", err)
	}

	err = s.queries.CreateAuditLog(ctx, dbsqlc.CreateAuditLogParams{
		EntityType:  auditEntityTransfer,
		Action:      schema.TransferActionExported,
		ActorUserID: int32(actorID),
		Note:        common.NullString(describeExport(filter, len(rows))),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to record transfer export: %w", err)
	}
	return toHistoryItems(rows), nil
}

func (s *transferService) GetTransferAuditLog(ctx context.Context, transferID int64) ([]*schema.TransferAuditEntry, error) {
	if _, err := s.GetTransferByID(ctx, transferID); err != nil {
		return nil, err
	}

	rows, err := s.queries.ListAuditLogsForEntity(ctx, dbsqlc.ListAuditLogsForEntityParams{
		EntityType: auditEntityTransfer,
		EntityID:   sql.NullInt32{Int32: int32(transferID), Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get audit log for transfer %d: %w", transferID, err)
	}
	entries := make([]*schema.TransferAuditEntry, 0, len(rows))
	for _, row := range rows {
		entries = append(entries, &schema.TransferAuditEntry{
			ID: int64(row.ID),
			TransferAction: schema.TransferAction{
				Action:    row.Action,
				ActorName: row.ActorName.String,
				ActorRole: row.ActorRole.String,
				Note:      row.Note.String,
				At:        row.CreatedAt.Format(transferTimeFormat),
			},
			ActorSchoolName: row.ActorSchoolName.String,
		})
	}
	return entries, nil
}

// historyParams converts the filter to query parameters without paging (every row).
func historyParams(filter *schema.TransferHistoryFilter) dbsqlc.ListTransfersForAdminParams {
	return dbsqlc.ListTransfersForAdminParams{
		Status:     common.NullString(filter.Status),
		RegionID:   nullID(filter.RegionID),
		DistrictID: nullID(filter.DistrictID),
		SchoolID:   nullID(filter.SchoolID),
		DateFrom:   nullDate(filter.DateFrom),
		DateTo:     nullDate(filter.DateTo),
		Search:     common.NullString(strings.TrimSpace(filter.Search)),
	}
}

func nullID(id int64) sql.NullInt32 {
	return sql.NullInt32{Int32: int32(id), Valid: id > 0}
}

// nullDate parses a "YYYY-MM-DD" day; the filter's validation has already checked the format.
func nullDate(value string) sql.NullTime {
	day, err := time.Parse(time.DateOnly, value)
	return sql.NullTime{Time: day, Valid: err == nil}
}

// describeExport is the audit note for an export: the filters used and the row count.
func describeExport(filter *schema.TransferHistoryFilter, rowCount int) string {
	parts := []string{fmt.Sprintf("%d transfers", rowCount)}
	add := func(label, value string) {
		if value != "" {
			parts = append(parts, label+" "+value)
		}
	}
	add("status", filter.Status)
	if filter.RegionID > 0 {
		add("region", fmt.Sprint(filter.RegionID))
	}
	if filter.DistrictID > 0 {
		add("district", fmt.Sprint(filter.DistrictID))
	}
	if filter.SchoolID > 0 {
		add("school", fmt.Sprint(filter.SchoolID))
	}
	add("from", filter.DateFrom)
	add("to", filter.DateTo)
	add("search", strings.TrimSpace(filter.Search))
	return strings.Join(parts, "; ")
}

func toHistoryItems(rows []dbsqlc.ListTransfersForAdminRow) []*schema.TransferHistoryItem {
	items := make([]*schema.TransferHistoryItem, 0, len(rows))
	for _, row := range rows {
		item := &schema.TransferHistoryItem{
			Transfer: *toTransfer(dbsqlc.GetTransferByIDRow{
				ID:               row.ID,
				StudentID:        row.StudentID,
				FromSchool:       row.FromSchool,
				ToSchool:         row.ToSchool,
				Status:           row.Status,
				DateInitiated:    row.DateInitiated,
				DateAccepted:     row.DateAccepted,
				Reason:           row.Reason,
				RejectionReason:  row.RejectionReason,
				StudentNumber:    row.StudentNumber,
				StudentFirstName: row.StudentFirstName,
				StudentLastName:  row.StudentLastName,
				FromSchoolName:   row.FromSchoolName,
				ToSchoolName:     row.ToSchoolName,
			}),
			FromDistrictName: row.FromDistrictName,
			FromRegionName:   row.FromRegionName,
			ToDistrictName:   row.ToDistrictName,
			ToRegionName:     row.ToRegionName,
		}
		if row.DecisionAction.Valid {
			item.Decision = &schema.TransferAction{
				Action:    row.DecisionAction.String,
				ActorName: row.DecisionActorName.String,
				ActorRole: row.DecisionActorRole.String,
				Note:      row.DecisionNote.String,
				At:        formatNullTime(row.DecisionAt),
			}
		}
		if row.CompletedAt.Valid {
			item.Completion = &schema.TransferAction{
				Action:    schema.TransferActionCompleted,
				ActorName: row.CompletedActorName.String,
				ActorRole: row.CompletedActorRole.String,
				At:        formatNullTime(row.CompletedAt),
			}
		}
		items = append(items, item)
	}
	return items
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

// notifySchools sends automatic notices about a transfer action that just succeeded
// (err is the action's result and is passed through). The school that has to act next,
// or that is affected, is told; when the super admin acted (byAdmin), both schools are,
// since neither school made the decision. A failed notice is logged but does not undo
// or fail the transfer action.
func (s *transferService) notifySchools(ctx context.Context, transfer *schema.Transfer, err error, action string, byAdmin bool) (*schema.Transfer, error) {
	if err != nil {
		return nil, err
	}
	student := fmt.Sprintf("%s (%s)", transfer.StudentName, transfer.StudentNumber)
	decidedBy := transfer.ToSchoolName
	if byAdmin {
		decidedBy = "The ministry (super admin)"
	}

	type notice struct {
		schoolID    int64
		title, body string
	}
	var notices []notice
	switch action {
	case schema.TransferActionCreated:
		body := fmt.Sprintf("%s has asked to transfer %s to your school.", transfer.FromSchoolName, student)
		if transfer.Reason != "" {
			body += " Reason: " + transfer.Reason + "."
		}
		notices = append(notices, notice{transfer.ToSchoolID, "New transfer request: " + transfer.StudentName,
			body + " Open Transfers to approve or reject it."})
	case schema.TransferActionApproved:
		notices = append(notices, notice{transfer.FromSchoolID, "Transfer approved: " + transfer.StudentName,
			fmt.Sprintf("%s approved the transfer of %s to %s. The student is now on the receiving school's register. Open Transfers to finalize it.",
				decidedBy, student, transfer.ToSchoolName)})
		if byAdmin {
			notices = append(notices, notice{transfer.ToSchoolID, "Transfer approved by the ministry: " + transfer.StudentName,
				fmt.Sprintf("The ministry approved the transfer of %s from %s to your school on your behalf. The student is now on your register.",
					student, transfer.FromSchoolName)})
		}
	case schema.TransferActionRejected:
		notices = append(notices, notice{transfer.FromSchoolID, "Transfer rejected: " + transfer.StudentName,
			fmt.Sprintf("%s rejected the transfer of %s to %s. Reason: %s", decidedBy, student, transfer.ToSchoolName, transfer.RejectionReason)})
		if byAdmin {
			notices = append(notices, notice{transfer.ToSchoolID, "Transfer rejected by the ministry: " + transfer.StudentName,
				fmt.Sprintf("The ministry rejected the transfer of %s from %s to your school on your behalf. Reason: %s",
					student, transfer.FromSchoolName, transfer.RejectionReason)})
		}
	case schema.TransferActionCompleted:
		notices = append(notices, notice{transfer.ToSchoolID, "Transfer completed: " + transfer.StudentName,
			fmt.Sprintf("The transfer of %s from %s to your school is complete.", student, transfer.FromSchoolName)})
		if byAdmin {
			notices = append(notices, notice{transfer.FromSchoolID, "Transfer completed by the ministry: " + transfer.StudentName,
				fmt.Sprintf("The ministry finalized the transfer of %s to %s.", student, transfer.ToSchoolName)})
		}
	}

	for _, n := range notices {
		err := s.queries.CreateSystemNotice(ctx, dbsqlc.CreateSystemNoticeParams{
			SchoolID: int32(n.schoolID),
			Title:    n.title,
			Body:     n.body,
		})
		if err != nil {
			s.logger.Error(loggedmodule.Transfers, "failed to send transfer notice", "transfer_id", transfer.ID, "school_id", n.schoolID, "error", err)
		}
	}
	return transfer, nil
}

// whyNotApproved replaces the generic "invalid state" error of a pending transfer that
// could not be approved with the reason: the learner left, moved or finished, or the
// receiving school closed, while the request was waiting.
func (s *transferService) whyNotApproved(ctx context.Context, transferID int64, err error) error {
	if !errors.Is(err, ErrTransferInvalidState) {
		return err
	}
	state, stateErr := s.queries.GetTransferApprovalState(ctx, int32(transferID))
	switch {
	case stateErr != nil:
		return err
	case !state.LearnerOk:
		return fmt.Errorf("%w (they are no longer a current learner at the sending school; reject the request)", ErrStudentNotActive)
	case !state.SchoolOpen:
		return ErrSchoolClosed
	}
	return err
}
