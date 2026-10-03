package admin

import (
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// GetSchoolReport returns one row per school with enrolment, transfer and pass-rate
// figures. Optional query parameters: region_id, district_id, academic_year_id
// (the year whose exam results are reported).
func GetSchoolReport(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		filter := schema.SchoolReportFilter{
			RegionID:       int64(ctx.QueryInt("region_id")),
			DistrictID:     int64(ctx.QueryInt("district_id")),
			AcademicYearID: int64(ctx.QueryInt("academic_year_id")),
		}
		if filter.RegionID < 0 || filter.DistrictID < 0 || filter.AcademicYearID < 0 {
			return problemdetail.BadRequest(ctx, "Invalid report filter")
		}

		report, err := reportService.GetSchoolReport(ctx.Context(), filter)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to get school report", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get school report")
		}
		return ctx.Status(fiber.StatusOK).JSON(report)
	}
}
