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

// ListMarks returns marks for the school's current students.
// Optional query parameters: academic_year_id, term (1-3), student_id.
func ListMarks(marksService services.MarksService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}
		filter := schema.MarksFilter{
			AcademicYearID: int64(ctx.QueryInt("academic_year_id")),
			Term:           ctx.QueryInt("term"),
			StudentID:      int64(ctx.QueryInt("student_id")),
		}
		if filter.AcademicYearID < 0 || filter.StudentID < 0 || filter.Term < 0 || filter.Term > 3 {
			return problemdetail.BadRequest(ctx, "Invalid marks filter")
		}

		marks, err := marksService.ListMarks(ctx.Context(), schoolID, filter)
		if err != nil {
			logger.Error(loggedmodule.Marks, "failed to list marks", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get marks")
		}
		return ctx.Status(fiber.StatusOK).JSON(marks)
	}
}

// SaveMarks upserts a batch of marks for one academic year and term; null marks are cleared.
func SaveMarks(marksService services.MarksService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDFromPath(ctx)
		if err != nil {
			return err
		}

		var req schema.SaveMarksRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)

		result, err := marksService.SaveMarks(ctx.Context(), schoolID, userID, &req)
		switch {
		case errors.Is(err, services.ErrMarkNotAllowed), errors.Is(err, services.ErrAcademicYearNotFound):
			return problemdetail.BadRequest(ctx, err.Error())
		case err != nil:
			logger.Error(loggedmodule.Marks, "failed to save marks", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to save marks")
		}
		return ctx.Status(fiber.StatusOK).JSON(result)
	}
}
