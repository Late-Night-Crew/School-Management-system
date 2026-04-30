package school

import (
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

func CreateTransferRequest(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		var req schema.CreateTransferRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		// Ensure the from_school_id matches the path school_id
		req.FromSchoolID = pathSchoolID

		transferRequest, err := transferService.CreateTransferRequest(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to create transfer request: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create transfer request")
		}

		return ctx.Status(fiber.StatusCreated).JSON(transferRequest)
	}
}

func GetIncomingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		req := &schema.GetIncomingTransfersRequest{
			ToSchoolID: pathSchoolID,
		}
		transfers, err := transferService.GetIncomingTransfersRequest(ctx.Context(), req)
		if err != nil {
			logger.Error("failed to get incoming transfers: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get incoming transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}

func GetOutgoingTransfers(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		req := &schema.GetOutgoingTransfersRequest{
			FromSchoolID: pathSchoolID,
		}

		transfers, err := transferService.GetOutgoingTransfers(ctx.Context(), req.FromSchoolID)
		if err != nil {
			logger.Error("failed to get outgoing transfers: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get outgoing transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}

func GetTransferByID(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		id, err := common.ParseIDParam(ctx, "id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID")
		}

		transfer, err := transferService.GetTransferByID(ctx.Context(), id)
		if err != nil {
			logger.Error("failed to get transfer by ID", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get transfer by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func ApproveTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID in path")
		}

		transfer, err := transferService.ApproveTransfer(ctx.Context(), transferID)
		if err != nil {
			logger.Error("failed to approve transfer: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to approve transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func FinalizeTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID in path")
		}

		transfer, err := transferService.FinalizeTransfer(ctx.Context(), transferID)
		if err != nil {
			logger.Error("failed to finalize transfer: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to finalize transfer")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}

func RejectTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		transferID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid transfer ID in path")
		}

		var req schema.RejectRequest
		if err := ctx.BodyParser(&req); err != nil {
			return problemdetail.BadRequest(ctx, "Invalid rejection reason provided")
		}

		if req.Reason == "" {
			return problemdetail.BadRequest(ctx, "Rejection reason cannot be empty.")
		}

		transfer, err := transferService.RejectTransfer(ctx.Context(), transferID, req.Reason)
		if err != nil {
			logger.Error("failed to reject transfer: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to reject transfer")
		}

		return ctx.Status(fiber.StatusOK).JSON(transfer)
	}
}
