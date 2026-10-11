package admin

import (
	"encoding/csv"
	"errors"
	"fmt"
	"strings"
	"time"

	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

func transferErrorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Transfer not found")
	case errors.Is(err, services.ErrStudentNotInSchool),
		errors.Is(err, services.ErrTransferSameSchool):
		return problemdetail.BadRequest(ctx, err.Error())
	case errors.Is(err, services.ErrTransferAlreadyPending),
		errors.Is(err, services.ErrTransferInvalidState):
		return problemdetail.Conflict(ctx, err.Error())
	}
	logger.Error(loggedmodule.Transfers, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func CreateTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateTransferRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		userID, _ := common.GetUserIDFromCtx(ctx)
		transfer, err := transferService.CreateTransferRequest(ctx.Context(), &req, userID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to create transfer request")
		}
		return ctx.Status(fiber.StatusCreated).JSON(transfer)
	}
}

func GetTransferByID(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		transfer, err := transferService.GetTransferByID(ctx.Context(), transferID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func ApproveTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		// The super admin approves on the receiving school's behalf, so a note is required
		var req schema.ApproveRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil || strings.TrimSpace(req.Note) == "" {
			return problemdetail.BadRequest(ctx, "A note explaining the approval is required")
		}

		userID, _ := common.GetUserIDFromCtx(ctx)
		transfer, err := transferService.ApproveTransfer(ctx.Context(), transferID, userID, strings.TrimSpace(req.Note))
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to approve transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func FinalizeTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		// The note is optional, so an empty body is allowed
		var req schema.FinalizeRequest
		if len(ctx.Body()) > 0 {
			if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
				return problemdetail.BadRequest(ctx, err.Error())
			}
		}

		userID, _ := common.GetUserIDFromCtx(ctx)
		transfer, err := transferService.FinalizeTransfer(ctx.Context(), transferID, userID, strings.TrimSpace(req.Note))
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to finalize transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func RejectTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		var req schema.RejectRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "A rejection reason is required")
		}

		userID, _ := common.GetUserIDFromCtx(ctx)
		transfer, err := transferService.RejectTransfer(ctx.Context(), transferID, userID, req.Reason)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to reject transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

// ListTransferHistory lists every transfer, one page at a time, filtered by the
// status, region_id, district_id, school_id, date_from, date_to and search query parameters.
func ListTransferHistory(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var filter schema.TransferHistoryFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		page, err := transferService.ListTransferHistory(ctx.Context(), &filter)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to list transfer history")
		}
		return ctx.Status(fiber.StatusOK).JSON(page)
	}
}

// ExportTransferHistory downloads every transfer matching the history filters as CSV.
// Each export is recorded in the audit log because it contains student details.
func ExportTransferHistory(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var filter schema.TransferHistoryFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		userID, _ := common.GetUserIDFromCtx(ctx)
		items, err := transferService.ExportTransferHistory(ctx.Context(), &filter, userID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to export transfer history")
		}

		var out strings.Builder
		out.WriteString("\uFEFF") // byte order mark so Excel reads the file as UTF-8
		writer := csv.NewWriter(&out)
		_ = writer.Write(transferCSVHeader)
		for _, item := range items {
			_ = writer.Write(transferCSVRow(item))
		}
		writer.Flush()
		if err := writer.Error(); err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to export transfer history")
		}

		filename := fmt.Sprintf("transfers-%s.csv", time.Now().Format("2006-01-02"))
		ctx.Set(fiber.HeaderContentType, "text/csv; charset=utf-8")
		ctx.Set(fiber.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s"`, filename))
		return ctx.Status(fiber.StatusOK).SendString(out.String())
	}
}

// GetTransferAuditLog returns a transfer's timeline: who created, approved, rejected
// or completed it, and when.
func GetTransferAuditLog(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		entries, err := transferService.GetTransferAuditLog(ctx.Context(), transferID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get transfer history")
		}
		return ctx.Status(fiber.StatusOK).JSON(entries)
	}
}

var transferCSVHeader = []string{
	"Transfer ID", "Student Number", "Student Name",
	"From School", "From District", "From Region",
	"To School", "To District", "To Region",
	"Status", "Date Initiated", "Reason",
	"Decision", "Decided By", "Decided By Role", "Decided On", "Decision Note",
	"Completed By", "Completed On",
}

func transferCSVRow(item *schema.TransferHistoryItem) []string {
	decision := item.Decision
	if decision == nil {
		decision = &schema.TransferAction{}
	}
	completion := item.Completion
	if completion == nil {
		completion = &schema.TransferAction{}
	}
	row := []string{
		fmt.Sprint(item.ID), item.StudentNumber, item.StudentName,
		item.FromSchoolName, item.FromDistrictName, item.FromRegionName,
		item.ToSchoolName, item.ToDistrictName, item.ToRegionName,
		item.Status, csvDate(item.DateInitiated), item.Reason,
		decision.Action, actorLabel(decision), roleLabel(decision.ActorRole), csvDate(decision.At), decision.Note,
		actorLabel(completion), csvDate(completion.At),
	}
	for i, cell := range row {
		row[i] = csvSafe(cell)
	}
	return row
}

// actorLabel names who performed an action, noting when it happened before audit logging.
func actorLabel(action *schema.TransferAction) string {
	if action.At == "" || action.ActorName != "" {
		return action.ActorName
	}
	return "Not recorded"
}

func roleLabel(role string) string {
	switch role {
	case schema.RoleSuperAdmin:
		return "Super Admin"
	case schema.RoleRegionalAdmin:
		return "Regional Admin"
	case schema.RoleSchoolManager:
		return "School Manager"
	}
	return role
}

// csvDate keeps the day of a "2006-01-02T15:04:05Z" timestamp; Excel reads it as a date.
func csvDate(value string) string {
	if len(value) >= 10 {
		return value[:10]
	}
	return value
}

// csvSafe stops spreadsheet programs from running a cell as a formula
// (free-text reasons and notes could start with =, +, - or @).
func csvSafe(cell string) string {
	if cell != "" && strings.ContainsRune("=+-@\t\r", rune(cell[0])) {
		return "'" + cell
	}
	return cell
}
