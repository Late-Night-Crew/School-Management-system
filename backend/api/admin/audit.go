package admin

import (
	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// ListAuditLogs returns a page of the activity log: who did what, and when.
func ListAuditLogs(service services.AuditService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var filter schema.AuditFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		page, err := service.List(ctx.Context(), &filter)
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to read activity log", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to read the activity log")
		}
		return ctx.JSON(page)
	}
}

func ListAuditActors(service services.AuditService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		actors, err := service.Actors(ctx.Context())
		if err != nil {
			logger.Error(loggedmodule.AdminRequests, "failed to list activity log people", "error", err)
			return problemdetail.ServerErrorProblem(ctx, "Failed to read the activity log")
		}
		return ctx.JSON(actors)
	}
}
