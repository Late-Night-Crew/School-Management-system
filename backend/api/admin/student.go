package admin

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"
)

func GetStudentByID(studentService services.StudentService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := ctx.ParamsInt("id")
		if err != nil || id < 1 {
			return problemdetail.BadRequest(ctx, "Invalid student ID")
		}
		student, err := studentService.GetStudentByID(ctx.Context(), int64(id))
		if err != nil {
			logger.Error("failed to get student by ID: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get student by ID")
		}
		return ctx.Status(fiber.StatusOK).JSON(student)
	}
}

func CreateStudent(studentService services.StudentService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateStudentRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		student, err := studentService.CreateStudent(ctx.Context(), &req)
		if errors.Is(err, services.ErrInvalidLearnerID) || errors.Is(err, services.ErrYearNotOpen) || errors.Is(err, services.ErrAcademicYearNotFound) {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if errors.Is(err, services.ErrSchoolClosed) || errors.Is(err, services.ErrDuplicateLearner) {
			return problemdetail.Conflict(ctx, err.Error())
		}
		if errors.Is(err, services.ErrNotFound) {
			return problemdetail.BadRequest(ctx, "The chosen school does not exist")
		}
		if err != nil {
			logger.Error("failed to create student: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create student")
		}
		return ctx.Status(fiber.StatusCreated).JSON(student)
	}
}

func UpdateStudent(studentService services.StudentService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		studentID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid student ID parameter")
		}
		var req schema.UpdateStudentRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = studentID
		student, err := studentService.UpdateStudent(ctx.Context(), &req)
		if errors.Is(err, services.ErrInvalidLearnerID) || errors.Is(err, services.ErrYearNotOpen) || errors.Is(err, services.ErrAcademicYearNotFound) {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if errors.Is(err, services.ErrSchoolClosed) || errors.Is(err, services.ErrDuplicateLearner) {
			return problemdetail.Conflict(ctx, err.Error())
		}
		if errors.Is(err, services.ErrNotFound) {
			return problemdetail.BadRequest(ctx, "The chosen school does not exist")
		}
		if err != nil {
			logger.Error("failed to update student: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update student")
		}
		return ctx.Status(fiber.StatusOK).JSON(student)
	}
}
func DeleteStudent(studentService services.StudentService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		studentID, err := common.ParseIDParam(ctx, "id")
		if err != nil {
			return problemdetail.BadRequest(ctx, "invalid student ID parameter")
		}
		err = studentService.DeleteStudent(ctx.Context(), studentID)
		if err != nil {
			logger.Error("failed to delete student: ", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete student")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

// FindSimilarStudents warns about likely duplicates before a learner is saved.
func FindSimilarStudents(studentService services.StudentService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var check schema.DuplicateCheckRequest
		if err := ctx.QueryParser(&check); err != nil {
			return problemdetail.BadRequest(ctx, "Invalid duplicate check")
		}
		similar, err := studentService.FindSimilar(ctx.Context(), &check)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to look for similar learners", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to check for duplicates")
		}
		return ctx.JSON(similar)
	}
}
