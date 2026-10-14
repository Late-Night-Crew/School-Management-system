package admin

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

// MCDE's view of a school's marks: the same screens as the coordinator's Enter Marks,
// but MCDE may also correct years the school has finished (which coordinators cannot).

func schoolIDParam(ctx *fiber.Ctx) (int64, error) {
	id, err := common.ParseIDParam(ctx, "id")
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid school ID")
	}
	return id, nil
}

func ListSchoolMarks(marksService services.MarksService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDParam(ctx)
		if err != nil {
			return err
		}
		filter := schema.MarksFilter{
			AcademicYearID: int64(ctx.QueryInt("academic_year_id")),
			Term:           ctx.QueryInt("term"),
			StudentID:      int64(ctx.QueryInt("student_id")),
			FormLevel:      ctx.QueryInt("form_level"),
		}
		if filter.AcademicYearID < 0 || filter.StudentID < 0 || filter.Term < 0 || filter.Term > 3 {
			return problemdetail.BadRequest(ctx, "Invalid marks filter")
		}
		marks, err := marksService.ListMarks(ctx.Context(), schoolID, filter)
		if err != nil {
			logger.Error(loggedmodule.Marks, "failed to list marks", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get marks")
		}
		return ctx.JSON(marks)
	}
}

func SaveSchoolMarks(marksService services.MarksService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDParam(ctx)
		if err != nil {
			return err
		}
		var req schema.SaveMarksRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		result, err := marksService.SaveMarks(ctx.Context(), schoolID, userID, &req, true)
		switch {
		case errors.Is(err, services.ErrMarkNotAllowed), errors.Is(err, services.ErrAcademicYearNotFound), errors.Is(err, services.ErrYearNotOpen):
			return problemdetail.BadRequest(ctx, err.Error())
		case errors.Is(err, services.ErrNotFound):
			return problemdetail.NotFound(ctx, "School not found")
		case err != nil:
			logger.Error(loggedmodule.Marks, "failed to save marks", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to save marks")
		}
		return ctx.JSON(result)
	}
}

// ListYearMarks returns who was at the school in a finished year and their marks for
// a term, in the form each learner was in that year.
func ListYearMarks(marksService services.MarksService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDParam(ctx)
		if err != nil {
			return err
		}
		yearID, term, form := ctx.QueryInt("academic_year_id"), ctx.QueryInt("term"), ctx.QueryInt("form_level")
		if yearID < 1 || term < 1 || term > 3 || form < 0 || form > 4 {
			return problemdetail.BadRequest(ctx, "Choose an academic year, a term (1-3) and optionally a form (1-4)")
		}
		result, err := marksService.YearMarks(ctx.Context(), schoolID, int64(yearID), term, form)
		if err != nil {
			logger.Error(loggedmodule.Marks, "failed to list a year's marks", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get marks")
		}
		return ctx.JSON(result)
	}
}
