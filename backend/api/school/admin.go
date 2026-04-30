package school

import (
	"errors"
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

func GetSchoolDashboard(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		stats, err := schoolAdminService.GetDashboardStats(ctx.Context(), pathSchoolID)
		if err != nil {
			logger.Error("failed to get school dashboard stats", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get dashboard stats")
		}
		return ctx.Status(fiber.StatusOK).JSON(stats)
	}
}

func GetStudentsForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		students, err := schoolAdminService.GetStudentsBySchoolID(ctx.Context(), pathSchoolID)
		if err != nil {
			logger.Error("failed to get students for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get students")
		}
		return ctx.Status(fiber.StatusOK).JSON(students)
	}
}

func GetStudentByIDForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		studentID, err := common.ParseIDParam(ctx, "id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid student ID")
		}

		student, err := schoolAdminService.GetStudentByIDAndSchoolID(ctx.Context(), pathSchoolID, studentID)
		if err != nil {
			if errors.Is(err, services.ErrNotFound) {
				return problemdetail.NotFound(ctx, "Student not found")
			}
			logger.Error("failed to get student for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get student")
		}
		return ctx.Status(fiber.StatusOK).JSON(student)
	}
}

func CreateStudentForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		var req schema.CreateStudentRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		student, err := schoolAdminService.CreateStudentForSchool(ctx.Context(), pathSchoolID, &req)
		if err != nil {
			logger.Error("failed to create student for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create student")
		}
		return ctx.Status(fiber.StatusCreated).JSON(student)
	}
}

func UpdateStudentForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		studentID, err := common.ParseIDParam(ctx, "id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid student ID")
		}

		var req schema.UpdateStudentRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		req.ID = studentID

		student, err := schoolAdminService.UpdateStudentForSchool(ctx.Context(), pathSchoolID, &req)
		if err != nil {
			logger.Error("failed to update student for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update student")
		}
		return ctx.Status(fiber.StatusOK).JSON(student)
	}
}

func DeleteStudentForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		studentID, err := common.ParseIDParam(ctx, "id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid student ID")
		}

		if err := schoolAdminService.DeleteStudentByIDAndSchoolID(ctx.Context(), pathSchoolID, studentID); err != nil {
			logger.Error("failed to delete student for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to delete student")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func ListExamResultsForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		examResults, err := schoolAdminService.ListExamResultsBySchoolID(ctx.Context(), pathSchoolID)
		if err != nil {
			logger.Error("failed to list exam results for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get exam results")
		}
		return ctx.Status(fiber.StatusOK).JSON(examResults)
	}
}

func GetExamResultForSchoolByAcademicYear(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		academicYearID, err := common.ParseIDParam(ctx, "academic_year_id")
		if err != nil || academicYearID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid academic year ID")
		}

		examResult, err := schoolAdminService.GetExamResultBySchoolIDAndYear(ctx.Context(), pathSchoolID, academicYearID)
		if err != nil {
			logger.Error("failed to get exam result for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get exam result")
		}
		return ctx.Status(fiber.StatusOK).JSON(examResult)
	}
}

func CreateExamResultForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		var req schema.CreateExamResultRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		examResult, err := schoolAdminService.CreateExamResult(ctx.Context(), pathSchoolID, &req)
		if err != nil {
			logger.Error("failed to create exam result for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to create exam result")
		}
		return ctx.Status(fiber.StatusCreated).JSON(examResult)
	}
}

func UpdateExamResultForSchool(schoolAdminService services.SchoolAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}

		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "School admin access required")
		}

		if tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}

		examResultID, err := common.ParseIDParam(ctx, "id")
		if err != nil || examResultID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid exam result ID")
		}

		var req schema.UpdateExamResultRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}

		examResult, err := schoolAdminService.UpdateExamResult(ctx.Context(), pathSchoolID, examResultID, &req)
		if err != nil {
			logger.Error("failed to update exam result for school", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to update exam result")
		}
		return ctx.Status(fiber.StatusOK).JSON(examResult)
	}
}
