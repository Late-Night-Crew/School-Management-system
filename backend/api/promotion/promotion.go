// Package promotion serves terms and the year-end promotion. Coordinators use the
// /school/:school_id routes for their own school; MCDE uses /admin, for any school and
// for every school at once.
package promotion

import (
	"context"
	"errors"

	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

const module loggedmodule.Name = "promotion"

func errorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Not found")
	case errors.Is(err, services.ErrInUse):
		return problemdetail.Conflict(ctx, err.Error())
	case errors.Is(err, services.ErrInvalidMove):
		return problemdetail.BadRequest(ctx, err.Error())
	}
	logger.Error(module, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

// schoolParam reads the school ID from the path (school_id or id, depending on the route).
func schoolParam(ctx *fiber.Ctx, name string) (int64, error) {
	id, err := common.ParseIDParam(ctx, name)
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid school ID")
	}
	return id, nil
}

func actorID(ctx *fiber.Ctx) int64 {
	id, _ := common.GetUserIDFromCtx(ctx)
	return id
}

func GetSettings(service services.PromotionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		settings, err := service.GetSettings(ctx.Context())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get promotion settings")
		}
		return ctx.JSON(settings)
	}
}

func UpdateSettings(service services.PromotionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.UpdatePromotionSettingsRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		settings, err := service.UpdateSettings(ctx.Context(), actorID(ctx), &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to save promotion settings")
		}
		return ctx.JSON(settings)
	}
}

func ListStages(service services.PromotionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		stages, err := service.ListStages(ctx.Context())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list school terms")
		}
		return ctx.JSON(stages)
	}
}

func AdvanceAll(service services.PromotionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.AdvanceAllRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		moved, err := service.AdvanceAll(ctx.Context(), actorID(ctx), req.FromTerm)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to move schools to the next term")
		}
		return ctx.JSON(fiber.Map{"moved": moved})
	}
}

func RunAutomatic(service services.PromotionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		summaries, err := service.RunAutomatic(ctx.Context(), actorID(ctx))
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to run the automatic promotion")
		}
		return ctx.JSON(summaries)
	}
}

func GetStage(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		stage, err := service.GetStage(ctx.Context(), schoolID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get the school's term")
		}
		return ctx.JSON(stage)
	}
}

func AdvanceTerm(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		stage, err := service.AdvanceTerm(ctx.Context(), actorID(ctx), schoolID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to move to the next term")
		}
		return ctx.JSON(stage)
	}
}

func PreviewYearEnd(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		preview, err := service.PreviewYearEnd(ctx.Context(), schoolID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to prepare the year-end promotion")
		}
		return ctx.JSON(preview)
	}
}

func ApplyYearEnd(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		var req schema.ApplyYearEndRequest
		if len(ctx.Body()) > 0 {
			if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
				return problemdetail.BadRequest(ctx, err.Error())
			}
		}
		summary, err := service.ApplyYearEnd(ctx.Context(), actorID(ctx), schoolID, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to apply the year-end promotion")
		}
		return ctx.JSON(summary)
	}
}

func LastYearResults(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		results, err := service.LastYearResults(ctx.Context(), schoolID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get last year's results")
		}
		return ctx.JSON(results)
	}
}

func AllowToProceed(service services.PromotionService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		studentID, err := common.ParseIDParam(ctx, "student_id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid learner ID")
		}
		if err := service.AllowToProceed(ctx.Context(), actorID(ctx), schoolID, studentID); err != nil {
			return errorResponse(ctx, logger, err, "Failed to move the learner up")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func ListTermDates(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		dates, err := service.ListTermDates(ctx.Context())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list term dates")
		}
		return ctx.JSON(dates)
	}
}

func SetTermDates(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		yearID, err := common.ParseIDParam(ctx, "id")
		if err != nil || yearID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid academic year")
		}
		var req schema.SetTermDatesRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		dates, err := service.SetTermDates(ctx.Context(), actorID(ctx), yearID, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to save term dates")
		}
		return ctx.JSON(dates)
	}
}

// SendRemindersNow runs the daily reminder check straight away (it never sends the
// same reminder twice).
func SendRemindersNow(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		run, err := service.SendDue(ctx.Context(), services.TodayInMalawi())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to send reminders")
		}
		return ctx.JSON(run)
	}
}

func GetReminderSettings(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		settings, err := service.GetSettings(ctx.Context())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get reminder settings")
		}
		return ctx.JSON(settings)
	}
}

func UpdateReminderSettings(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.ReminderSettings
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		settings, err := service.UpdateSettings(ctx.Context(), actorID(ctx), &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to save reminder settings")
		}
		return ctx.JSON(settings)
	}
}

// CreateAcademicYear creates a year together with its three terms' dates.
func CreateAcademicYear(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.CreateAcademicYearRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		year, err := service.CreateYearWithTerms(ctx.Context(), &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to create academic year")
		}
		return ctx.Status(fiber.StatusCreated).JSON(year)
	}
}

// CheckYearDates stops an academic year edit that would leave a term outside the year,
// then hands over to the existing update handler.
func CheckYearDates(service services.ReminderService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		yearID, err := common.ParseIDParam(ctx, "id")
		if err != nil || yearID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid academic year")
		}
		var body struct {
			StartDate string `json:"start_date"`
			EndDate   string `json:"end_date"`
		}
		if err := ctx.BodyParser(&body); err != nil {
			return problemdetail.BadRequest(ctx, "Invalid academic year")
		}
		if err := service.CheckYearDates(ctx.Context(), yearID, body.StartDate, body.EndDate); err != nil {
			return errorResponse(ctx, logger, err, "Failed to check the term dates")
		}
		return ctx.Next()
	}
}

func learnerStatusError(ctx *fiber.Ctx, logger logging.Logger, err error) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Learner not found")
	case errors.Is(err, services.ErrLearnerStatus):
		return problemdetail.Conflict(ctx, err.Error())
	}
	logger.Error(module, "failed to change learner status", "error", err)
	return problemdetail.ServerErrorProblem(ctx, "Failed to change the learner's status")
}

// learnerChanger is what MarkLeft and Reinstate need: the student and school-admin
// services both provide it.
type learnerChanger interface {
	MarkLeft(ctx context.Context, actorID, schoolID, studentID int64, req *schema.LeaveRequest) error
	Reinstate(ctx context.Context, actorID, schoolID, studentID int64) error
}

// MarkLearnerLeft records that a learner withdrew or dropped out. param names the
// school ID in the path (coordinators); empty means any learner (MCDE).
func MarkLearnerLeft(service learnerChanger, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var schoolID int64
		if param != "" {
			id, err := schoolParam(ctx, param)
			if err != nil {
				return err
			}
			schoolID = id
		}
		studentID, err := common.ParseIDParam(ctx, "student_id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid learner ID")
		}
		var req schema.LeaveRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if err := service.MarkLeft(ctx.Context(), actorID(ctx), schoolID, studentID, &req); err != nil {
			return learnerStatusError(ctx, logger, err)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func ReinstateLearner(service learnerChanger, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var schoolID int64
		if param != "" {
			id, err := schoolParam(ctx, param)
			if err != nil {
				return err
			}
			schoolID = id
		}
		studentID, err := common.ParseIDParam(ctx, "student_id")
		if err != nil || studentID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid learner ID")
		}
		if err := service.Reinstate(ctx.Context(), actorID(ctx), schoolID, studentID); err != nil {
			return learnerStatusError(ctx, logger, err)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}
