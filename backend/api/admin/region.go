package admin

import (
	"github.com/gofiber/fiber/v2"
	"nsms/pkg/problemdetail"
	"nsms/common"
	"nsms/logging"
	"nsms/schema"
	"nsms/services"
)

func GetRegionList(regionService services.RegionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.GetRegionListRequest
		if err := common.ParseQueryParamsThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "invalid request body")
		}
		regions, err := regionService.GetRegionList(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to get region list: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get region list")
		}
		return ctx.Status(fiber.StatusOK).JSON(regions)
	}
}

func CreateRegion(regionService services.RegionService,logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateRegionRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		region, err := regionService.CreateRegion(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to create region: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create region")
		}
		return ctx.Status(fiber.StatusCreated).JSON(region)
	}
}

func UpdateRegion(regionService services.RegionService,logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid region ID")
		}
		var req schema.UpdateRegionRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = regionID
		region, err := regionService.UpdateRegion(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to update region: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update region")
		}
		return ctx.Status(fiber.StatusOK).JSON(region)
	}
}

func DeleteRegion(regionService services.RegionService,logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid region ID")
		}
		err = regionService.DeleteRegion(ctx.Context(), regionID)
		if err != nil {
			logger.Error("failed to delete region", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete region")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func GetRegionByID(regionService services.RegionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1{
			return problemdetail.BadRequest(ctx, "Invalid region ID")
		}
		region, err := regionService.GetRegionByID(ctx.Context(), int64(id))
		if err != nil {
		
			logger.Error("failed to get region by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get region by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(region)
	}
}