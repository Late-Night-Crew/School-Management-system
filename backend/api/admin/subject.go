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

func GetSubjectByID(subjectService services.SubjectService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid subject ID")
		}
		subject, err := subjectService.GetSubjectByID(ctx.Context(), int32(id))
		if err != nil {
			logger.Error("failed to get subject by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get subject by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(subject)
	}
}

func GetSubjectList(subjectService services.SubjectService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		subjects, err := subjectService.ListSubjects(ctx.Context())
		if err != nil {
			logger.Error("failed to get subject list: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get subject list")
		}
		return ctx.Status(fiber.StatusOK).JSON(subjects)
	}
}

func CreateSubject(subjectService services.SubjectService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateSubjectRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		subject, err := subjectService.CreateSubject(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to create subject: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create subject")
		}
		return ctx.Status(fiber.StatusCreated).JSON(subject)
	}
}

func UpdateSubject(subjectService services.SubjectService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		subjectID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid subject ID")
		}
		// The ID comes from the path: set it before validation (it is required) and
		// again after, in case the body sent a different one.
		req := schema.UpdateSubjectRequest{ID: int32(subjectID)}
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = int32(subjectID)
		subject, err := subjectService.UpdateSubject(ctx.Context(), &req)
		if err != nil {
			logger.Error("failed to update subject: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update subject")
		}
		return ctx.Status(fiber.StatusOK).JSON(subject)
	}
}

func DeleteSubject(subjectService services.SubjectService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		subjectID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "Invalid subject ID")
		}
		err = subjectService.DeleteSubject(ctx.Context(), int32(subjectID))
		if errors.Is(err, services.ErrNotFound) {
			return problemdetail.NotFound(ctx, "Not found")
		}
		if errors.Is(err, services.ErrInUse) {
			return problemdetail.Conflict(ctx, err.Error())
		}
		if err != nil {
			logger.Error("failed to delete subject: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete subject")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
