package admin

import (
	"github.com/gofiber/fiber/v2"
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"
)

func GetAcademicYearByID(academicYearService services.AcademicYearService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid academic year ID")
		}
		academicYear, err := academicYearService.GetAcademicYearByID(ctx.Context(), int64(id))
		if err != nil {
			logger.Error("failed to get academic year by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get academic year by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(academicYear)
	}
}
func GetAcademicYearList(academicYearService services.AcademicYearService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.GetAcademicYearListRequest
		if err:= common.ParseQueryParamsThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "invalid request body")
		}
		academicYears, err := academicYearService.GetAcademicYearList(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to get academic year list: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get academic year list")
		}
		return ctx.Status(fiber.StatusOK).JSON(academicYears)
	}
}
func UpdateAcademicYear(academicYearService services.AcademicYearService,logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		academicYearID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid academic year ID")
		}
		var req schema.UpdateAcademicYearRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = academicYearID
		academicYear, err := academicYearService.UpdateAcademicYear(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to update academic year: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update academic year")
		}
		return ctx.Status(fiber.StatusOK).JSON(academicYear)
	}
}
func DeleteAcademicYear(academicYearService services.AcademicYearService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		academicYearID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid academic year ID")
		}
		err = academicYearService.DeleteAcademicYear(ctx.Context(), academicYearID)
		if err != nil {
			logger.Error("failed to delete academic year: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete academic year")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

