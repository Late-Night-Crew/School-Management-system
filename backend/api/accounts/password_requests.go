package accounts

import (
	"nsms/common"
	"nsms/logging"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// Forgot-password requests: the public form on the sign-in page, and the queue the
// office above the person works through (MCDE for division officers, the division for
// school users).

// requestReceived is the same whether or not the details matched an account.
const requestReceived = "If these details match an account, your request has been sent. You will be contacted with a temporary password."

func GetPublicPlaces(service services.PasswordRequestService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		places, err := service.PublicPlaces(ctx.Context())
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to load divisions and schools")
		}
		return ctx.JSON(places)
	}
}

func RequestPasswordReset(service services.PasswordRequestService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		var req schema.PasswordRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if err := service.Request(ctx.Context(), &req, ctx.IP()); err != nil {
			return errorResponse(ctx, logger, err, "Failed to send your request")
		}
		return ctx.Status(fiber.StatusAccepted).JSON(fiber.Map{"message": requestReceived})
	}
}

func ListPasswordRequests(service services.PasswordRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		requests, err := service.List(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list password requests")
		}
		return ctx.JSON(requests)
	})
}

func ResolvePasswordRequest(service services.PasswordRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		issued, err := service.Resolve(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to reset the password")
		}
		return ctx.JSON(issued)
	})
}

func DismissPasswordRequest(service services.PasswordRequestService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		if err := service.Dismiss(ctx.Context(), actor, id); err != nil {
			return errorResponse(ctx, logger, err, "Failed to dismiss the request")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}
