package school

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

// schoolIDFromPath returns the :school_id path parameter after checking it matches
// the school in the caller's token. On failure the problem response has already been
// written and the returned error should be returned by the handler.
func schoolIDFromPath(ctx *fiber.Ctx) (int64, error) {
	pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
	if err != nil || pathSchoolID < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid school ID")
	}

	tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
	if err != nil {
		return 0, problemdetail.Unauthorized(ctx, "School admin access required")
	}

	if tokenSchoolID != pathSchoolID {
		return 0, problemdetail.Forbidden(ctx, "Forbidden school access")
	}
	return pathSchoolID, nil
}

func transferErrorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Transfer not found")
	case errors.Is(err, services.ErrStudentNotInSchool),
		errors.Is(err, services.ErrTransferSameSchool):
		return problemdetail.BadRequest(ctx, err.Error())
	case errors.Is(err, services.ErrTransferWrongSchool):
		return problemdetail.Forbidden(ctx, err.Error())
	case errors.Is(err, services.ErrTransferAlreadyPending),
		errors.Is(err, services.ErrTransferInvalidState):
		return problemdetail.Conflict(ctx, err.Error())
	}
	logger.Error(loggedmodule.Transfers, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func CreateTransferRequest(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		var req schema.CreateTransferRequest
		// from_school always comes from the path: set it before validation so the
		// required check passes, and again after in case the body sent another value.
		req.FromSchoolID = schoolID
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.FromSchoolID = schoolID

		transfer, err := transferService.CreateTransferRequest(ctx.Context(), &req)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to create transfer request")
		}
		return ctx.Status(fiber.StatusCreated).JSON(transfer)
	}
}

func GetIncomingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transfers, err := transferService.GetIncomingTransfers(ctx.Context(), schoolID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get incoming transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}

func GetOutgoingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transfers, err := transferService.GetOutgoingTransfers(ctx.Context(), schoolID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get outgoing transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}

func GetTransferByID(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		transfer, err := transferService.GetTransferByIDForSchool(ctx.Context(), transferID, schoolID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to get transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

// ApproveTransfer lets the receiving school accept a pending transfer.
func ApproveTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		transfer, err := transferService.ApproveTransferForSchool(ctx.Context(), transferID, schoolID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to approve transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

// FinalizeTransfer lets the sending school complete an accepted transfer.
func FinalizeTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		transfer, err := transferService.FinalizeTransferForSchool(ctx.Context(), transferID, schoolID)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to finalize transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

// RejectTransfer lets the receiving school decline a pending transfer.
func RejectTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil || transferID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		var req schema.RejectRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "A rejection reason is required")
		}

		transfer, err := transferService.RejectTransferForSchool(ctx.Context(), transferID, schoolID, req.Reason)
		if err != nil {
			return transferErrorResponse(ctx, logger, err, "Failed to reject transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}
