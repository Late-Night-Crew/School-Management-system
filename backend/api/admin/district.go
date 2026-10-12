package admin

import (
	"github.com/gofiber/fiber/v2"
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"
)

func GetDistrictByID(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid district ID")
		}
		district, err := districtService.GetDistrictByID(ctx.Context(), int64(id))
		if err != nil {
			logger.Error("failed to get district by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get district by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(district)
	}
}

func GetDistrictList(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.GetDistrictListRequest
		if err:= common.ParseQueryParamsThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "invalid request body")
		}
		district, err := districtService.GetDistrictList(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to get district list: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get district list")
		}
		return ctx.Status(fiber.StatusOK).JSON(district)
	}
}

func CreateDistrict(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateDistrictRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		district, err := districtService.CreateDistrict(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to create district: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create district")
		}
		return ctx.Status(fiber.StatusCreated).JSON(district)
	}
}

func UpdateDistrict(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		districtID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid district ID")
		}
		var req schema.UpdateDistrictRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = districtID
		district, err := districtService.UpdateDistrict(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to update district: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update district")
		}
		return ctx.Status(fiber.StatusOK).JSON(district)
	}
}

func DeleteDistrict(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		districtID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid district ID")
		}
		if err := districtService.DeleteDistrict(ctx.Context(), districtID); err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to delete district")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}