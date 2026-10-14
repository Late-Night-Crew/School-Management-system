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

func ListSchoolStudents(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolIDParam(ctx)
		if err != nil {
			return err
		}
		students, err := schoolAdminService.GetStudentsBySchoolID(ctx.Context(), schoolID)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to get school students", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get students")
		}
		return ctx.JSON(students)
	}
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
