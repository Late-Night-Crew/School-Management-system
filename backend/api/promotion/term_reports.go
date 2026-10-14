package promotion

import (
	"strconv"

	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// End-of-term reports and learner progress. param names the school ID in the path
// (school_id for coordinators, id for MCDE); an empty param means any school.

func yearTerm(ctx *fiber.Ctx) (int64, int, error) {
	year, err := common.ParseIDParam(ctx, "year_id")
	if err != nil || year < 1 {
		return 0, 0, problemdetail.BadRequest(ctx, "Invalid academic year")
	}
	term, err := strconv.Atoi(ctx.Params("term"))
	if err != nil || term < 1 || term > 3 {
		return 0, 0, problemdetail.BadRequest(ctx, "Invalid term")
	}
	return year, term, nil
}

func ListTermReports(service services.TermReportService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		reports, err := service.ListForSchool(ctx.Context(), schoolID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list term reports")
		}
		return ctx.JSON(reports)
	}
}

func GetTermReport(service services.TermReportService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		year, term, err := yearTerm(ctx)
		if err != nil {
			return err
		}
		report, err := service.Get(ctx.Context(), schoolID, year, term)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get the term report")
		}
		return ctx.JSON(report)
	}
}

func RegenerateTermReport(service services.TermReportService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		schoolID, err := schoolParam(ctx, param)
		if err != nil {
			return err
		}
		year, term, err := yearTerm(ctx)
		if err != nil {
			return err
		}
		report, err := service.Regenerate(ctx.Context(), actorID(ctx), schoolID, year, term)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to regenerate the term report")
		}
		return ctx.JSON(report)
	}
}

// CompareTerm lists every school's report for one term. regionParam, when set, limits
// it to the division in the path (division officers); otherwise region_id may filter.
func CompareTerm(service services.TermReportService, logger logging.Logger, regionParam string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var filter schema.TermReportFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if regionParam != "" {
			region, err := common.ParseIDParam(ctx, regionParam)
			if err != nil || region < 1 {
				return problemdetail.BadRequest(ctx, "Invalid division")
			}
			filter.RegionID = region
		}
		rows, err := service.ListForTerm(ctx.Context(), &filter)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to compare schools for the term")
		}
		return ctx.JSON(rows)
	}
}

func LearnerProgress(service services.TermReportService, logger logging.Logger, param string) fiber.Handler {
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
		progress, err := service.LearnerProgress(ctx.Context(), schoolID, studentID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get the learner's progress")
		}
		return ctx.JSON(progress)
	}
}
