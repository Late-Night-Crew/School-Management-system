// Package region serves read-only views of one region for regional admins.
// Access (role and matching region_id) is enforced by RequireRegionAccess.
package region

import (
	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

const module loggedmodule.Name = "region:requests"

func regionIDFromPath(ctx *fiber.Ctx) (int64, error) {
	regionID, err := common.ParseIDFromCtx(ctx, "region_id")
	if err != nil || regionID < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid region ID")
	}
	return regionID, nil
}

// queryID reads an optional positive ID query parameter; ok is false when it is invalid.
func queryID(ctx *fiber.Ctx, name string) (id int64, ok bool) {
	value := ctx.QueryInt(name)
	return int64(value), value >= 0
}

func GetDashboard(regionService services.RegionAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := regionIDFromPath(ctx)
		if err != nil {
			return err
		}
		stats, err := regionService.GetDashboardStats(ctx.Context(), regionID)
		if err != nil {
			logger.Error(module, "failed to get region dashboard", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get dashboard stats")
		}
		return ctx.Status(fiber.StatusOK).JSON(stats)
	}
}

func ListDistricts(regionService services.RegionAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := regionIDFromPath(ctx)
		if err != nil {
			return err
		}
		districts, err := regionService.ListDistricts(ctx.Context(), regionID)
		if err != nil {
			logger.Error(module, "failed to list region districts", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get districts")
		}
		return ctx.Status(fiber.StatusOK).JSON(districts)
	}
}

// ListSchools returns the school report rows for the region.
// Optional query parameters: district_id, academic_year_id (year of the pass rates).
func ListSchools(reportService services.ReportService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := regionIDFromPath(ctx)
		if err != nil {
			return err
		}
		districtID, ok1 := queryID(ctx, "district_id")
		academicYearID, ok2 := queryID(ctx, "academic_year_id")
		if !ok1 || !ok2 {
			return problemdetail.BadRequest(ctx, "Invalid filter")
		}

		schools, err := reportService.GetSchoolReport(ctx.Context(), schema.SchoolReportFilter{
			RegionID:       regionID,
			DistrictID:     districtID,
			AcademicYearID: academicYearID,
		})
		if err != nil {
			logger.Error(module, "failed to list region schools", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get schools")
		}
		return ctx.Status(fiber.StatusOK).JSON(schools)
	}
}

// ListStudents returns the region's students. Optional query parameters: district_id, school_id.
func ListStudents(regionService services.RegionAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := regionIDFromPath(ctx)
		if err != nil {
			return err
		}
		districtID, ok1 := queryID(ctx, "district_id")
		schoolID, ok2 := queryID(ctx, "school_id")
		if !ok1 || !ok2 {
			return problemdetail.BadRequest(ctx, "Invalid filter")
		}

		students, err := regionService.ListStudents(ctx.Context(), regionID, schema.RegionStudentFilter{
			DistrictID: districtID,
			SchoolID:   schoolID,
		})
		if err != nil {
			logger.Error(module, "failed to list region students", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get students")
		}
		return ctx.Status(fiber.StatusOK).JSON(students)
	}
}

// ListTransfers returns transfers into or out of any school in the region.
func ListTransfers(regionService services.RegionAdminService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		regionID, err := regionIDFromPath(ctx)
		if err != nil {
			return err
		}
		transfers, err := regionService.ListTransfers(ctx.Context(), regionID)
		if err != nil {
			logger.Error(module, "failed to list region transfers", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to get transfers")
		}
		return ctx.Status(fiber.StatusOK).JSON(transfers)
	}
}
