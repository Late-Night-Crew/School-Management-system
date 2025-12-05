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