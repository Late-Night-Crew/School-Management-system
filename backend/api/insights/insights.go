// Package insights serves the figures behind the dashboards' charts.
package insights

import (
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// Get returns the insights for the country, or for the division or school named by
// the route parameter param ("region_id" or "school_id"; "" for the country).
func Get(service services.InsightsService, logger logging.Logger, param string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var regionID, schoolID int64
		if param != "" {
			id, err := ctx.ParamsInt(param)
			if err != nil || id < 1 {
				return problemdetail.BadRequest(ctx, "invalid id")
			}
			if param == "region_id" {
				regionID = int64(id)
			} else {
				schoolID = int64(id)
			}
		}
		insights, err := service.For(ctx.Context(), regionID, schoolID)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to gather dashboard figures", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to load the dashboard charts")
		}
		return ctx.JSON(insights)
	}
}
