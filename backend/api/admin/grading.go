package admin

import (
	"errors"

	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

func GetGradingScale(gradingService services.GradingService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		scale, err := gradingService.GetGradingScale(ctx.Context())
		if err != nil {
			logger.Error("failed to get grading scale: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get grading scale")
		}
		return ctx.Status(fiber.StatusOK).JSON(scale)
	}
}

func SaveGradingScale(gradingService services.GradingService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.SaveGradingScaleRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		scale, err := gradingService.SaveGradingScale(ctx.Context(), userID, &req)
		if errors.Is(err, services.ErrInvalidGradingScale) {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if err != nil {
			logger.Error("failed to save grading scale: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to save grading scale")
		}
		return ctx.Status(fiber.StatusOK).JSON(scale)
	}
}
