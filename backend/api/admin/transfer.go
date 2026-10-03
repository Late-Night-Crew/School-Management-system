package admin

import (
	"errors"

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

		transfer, err := transferService.CreateTransferRequest(ctx.Context(), &req)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to create transfer request")
		}
		return ctx.Status(fiber.StatusCreated).JSON(transfer)
	}
}

// GetIncomingTransfers lists transfers into the school given by the school_id query parameter.
func GetIncomingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID := ctx.QueryInt("school_id")
		if schoolID < 1 {
			return problemdetail.BadRequest(ctx, "school_id query parameter is required")
		}

		transfers, err := transferService.GetIncomingTransfers(ctx.Context(), int64(schoolID))
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get incoming transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}

// GetOutgoingTransfers lists transfers out of the school given by the school_id query parameter.
func GetOutgoingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID := ctx.QueryInt("school_id")
		if schoolID < 1 {
			return problemdetail.BadRequest(ctx, "school_id query parameter is required")
		}

		transfers, err := transferService.GetOutgoingTransfers(ctx.Context(), int64(schoolID))
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get outgoing transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
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

		transfer, err := transferService.ApproveTransfer(ctx.Context(), transferID)
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

		transfer, err := transferService.FinalizeTransfer(ctx.Context(), transferID)
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

		transfer, err := transferService.RejectTransfer(ctx.Context(), transferID, req.Reason)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to reject transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}
