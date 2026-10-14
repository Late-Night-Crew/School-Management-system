// Package learners serves the paged learner lists.
package learners

import (
	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// Search returns one page of learners. regionParam or schoolParam name the route
// parameter that fixes the division or school (division and school users); they
// override the same filter in the query.
func Search(service services.LearnerSearchService, logger logging.Logger, regionParam, schoolParam string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var filter schema.StudentSearch
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		for param, target := range map[string]*int64{regionParam: &filter.RegionID, schoolParam: &filter.SchoolID} {
			if param == "" {
				continue
			}
			id, err := ctx.ParamsInt(param)
			if err != nil || id < 1 {
				return problemdetail.BadRequest(ctx, "invalid id")
			}
			*target = int64(id)
		}
		// A division sees who and where its learners are, not their personal details
		filter.Overview = regionParam != ""
		page, err := service.Search(ctx.Context(), &filter)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to search learners", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to load learners")
		}
		return ctx.JSON(page)
	}
}
