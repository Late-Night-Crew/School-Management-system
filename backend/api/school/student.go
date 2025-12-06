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

		var req schema.CreateTransferRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

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
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}
		req := &schema.GetIncomingTransfersRequest{
			ToSchoolID: int64(id),
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
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}
		req := &schema.GetOutgoingTransfersRequest{
			FromSchoolID: int64(id),
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
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid tranfser ID")
		}
		transfer, err := transferService.GetTransferByID(ctx.Context(), int64(id))
		if err != nil {
			logger.Error("failed to get transfer by ID", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get tranfser by ID")
		}
		return ctx.Status(fiber.StatusAccepted).JSON(transfer)
	}
}

func ApproveTransfer(transferService services.TransferService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
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
        // 1. Parse transfer ID from path
        transferID, err := common.ParseIDParam(ctx, "id")
        if err != nil {
            return problemdetail.BadRequest(ctx, "Invalid transfer ID in path")
        }

        // 2. Parse the reason from the request body
        var req schema.RejectRequest
        if err := ctx.BodyParser(&req); err != nil {
            return problemdetail.BadRequest(ctx, "Invalid rejection reason provided")
        }
        
        // 3. (Optional Validation) Check if the reason is not empty
        if req.Reason == "" {
             return problemdetail.BadRequest(ctx, "Rejection reason cannot be empty.")
        }
        
        // 4. Call the service
        transfer, err := transferService.RejectTransfer(ctx.Context(), transferID, req.Reason)
        if err != nil {
            logger.Error("failed to reject transfer: ", "error", err)
            return problemdetail.ServerErrorProblem(ctx, "Failed to reject transfer")
        }

        // 5. Return the result
        return ctx.Status(fiber.StatusOK).JSON(transfer)
    }
}