// Package requests serves school registration requests: division officers fill in and
// submit them, the super admin accepts them.
package requests

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

const module loggedmodule.Name = "school-requests"

func withActor(handle func(ctx *fiber.Ctx, actor schema.Actor) error) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		actor, err := common.GetActorFromCtx(ctx)
		if err != nil {
			return problemdetail.Forbidden(ctx, "Your account is not linked to a division")
		}
		return handle(ctx, actor)
	}
}

func idParam(ctx *fiber.Ctx) (int64, error) {
	id, err := common.ParseIDParam(ctx, "id")
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid request ID")
	}
	return id, nil
}

func errorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "School request not found")
	case errors.Is(err, services.ErrRequestForbidden):
		return problemdetail.Forbidden(ctx, err.Error())
	case errors.Is(err, services.ErrInUse):
		return problemdetail.Conflict(ctx, err.Error())
	case errors.Is(err, services.ErrRequestIncomplete), errors.Is(err, services.ErrInvalidMove):
		return problemdetail.BadRequest(ctx, err.Error())
	}
	logger.Error(module, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func List(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var filter schema.SchoolRequestFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		requests, err := service.ListRequests(ctx.Context(), actor, filter)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list school requests")
		}
		return ctx.JSON(requests)
	})
}

func Get(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		request, err := service.GetRequest(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get school request")
		}
		return ctx.JSON(request)
	})
}

func Create(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var form schema.SchoolRequestForm
		if _, err := common.ParseBodyThenValidate(ctx, &form); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		request, err := service.CreateRequest(ctx.Context(), actor, &form)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to create school request")
		}
		return ctx.Status(fiber.StatusCreated).JSON(request)
	})
}

func Update(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var form schema.SchoolRequestForm
		if _, err := common.ParseBodyThenValidate(ctx, &form); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		request, err := service.UpdateRequest(ctx.Context(), actor, id, &form)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to save school request")
		}
		return ctx.JSON(request)
	})
}

func Submit(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		request, err := service.SubmitRequest(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to submit school request")
		}
		return ctx.JSON(request)
	})
}

func Delete(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		if err := service.DeleteRequest(ctx.Context(), actor, id); err != nil {
			return errorResponse(ctx, logger, err, "Failed to delete school request")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func Accept(service services.SchoolRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.AcceptSchoolRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		result, err := service.AcceptRequest(ctx.Context(), actor, id, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to accept school request")
		}
		return ctx.JSON(result)
	})
}
