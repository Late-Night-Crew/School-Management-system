package admin

import (
	"github.com/gofiber/fiber/v2"
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"
)

func GetSchoolByID(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}
		school, err := schoolService.GetSchoolByID(ctx.Context(), int64(id))
		if err != nil {
			logger.Error("failed to get school by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get school by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(school)
	}
}

func GetSchoolList(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.GetSchoolListRequest
		if err:= common.ParseQueryParamsThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "invalid request body")
		}
		school, err := schoolService.GetSchoolList(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to get school list: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get school list")
		}
		return ctx.Status(fiber.StatusOK).JSON(school)
	}
}

func CreateSchool(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateSchoolRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		school, err := schoolService.CreateSchool(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to create school: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create school")
		}
		return ctx.Status(fiber.StatusCreated).JSON(school)
	}
}

func UpdateSchool(schoolService services.SchoolService,logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid school ID")
		}
		var req schema.UpdateSchoolRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = schoolID
		school, err := schoolService.UpdateSchool(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to update school: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update school")
		}
		return ctx.Status(fiber.StatusOK).JSON(school)
	}
}

func DeleteSchool(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid school ID")
		}
		if err := schoolService.DeleteSchool(ctx.Context(), schoolID); err != nil {
			logger.Error("failed to delete school: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete school")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}