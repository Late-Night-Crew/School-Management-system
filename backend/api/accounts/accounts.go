// Package accounts serves account management, the signed-in user's own account,
// and the contact directory. Who the caller is comes from their token.
package accounts

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

func withActor(handle func(ctx *fiber.Ctx, actor schema.Actor) error) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		actor, err := common.GetActorFromCtx(ctx)
		if err != nil {
			return problemdetail.Forbidden(ctx, "Your account is not linked to a division or school")
		}
		return handle(ctx, actor)
	}
}

func errorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Not found")
	case errors.Is(err, services.ErrAccountForbidden), errors.Is(err, services.ErrContactForbidden):
		return problemdetail.Forbidden(ctx, err.Error())
	case errors.Is(err, services.ErrEmailInUse), errors.Is(err, services.ErrRegionHasAdmin), errors.Is(err, services.ErrSchoolClosed),
		errors.Is(err, services.ErrInUse):
		return problemdetail.Conflict(ctx, err.Error())
	case errors.Is(err, common.ErrInvalidPhone),
		errors.Is(err, services.ErrAccountScope),
		errors.Is(err, services.ErrAccountScopeGone),
		errors.Is(err, services.ErrWrongPassword),
		errors.Is(err, services.ErrWeakPassword),
		errors.Is(err, services.ErrSamePassword):
		return problemdetail.BadRequest(ctx, err.Error())
	}
	logger.Error(loggedmodule.Accounts, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func idParam(ctx *fiber.Ctx) (int64, error) {
	id, err := common.ParseIDParam(ctx, "id")
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid ID")
	}
	return id, nil
}

func ListAccounts(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var filter schema.AccountFilter
		if err := common.ParseQueryParamsThenValidate(ctx, &filter); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		accounts, err := service.ListAccounts(ctx.Context(), actor, &filter)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list accounts")
		}
		return ctx.JSON(accounts)
	})
}

func CreateAccount(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var req schema.CreateAccountRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		created, err := service.CreateAccount(ctx.Context(), actor, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to create account")
		}
		// The temporary password must never be cached
		ctx.Set(fiber.HeaderCacheControl, "no-store")
		return ctx.Status(fiber.StatusCreated).JSON(created)
	})
}

func UpdateAccount(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.UpdateAccountRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		account, err := service.UpdateAccount(ctx.Context(), actor, id, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to update account")
		}
		return ctx.JSON(account)
	})
}

// SetAccountActive deactivates (active=false) or reactivates an account.
func SetAccountActive(service services.AccountService, logger logging.Logger, active bool) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.SetAccountActiveRequest
		if len(ctx.Body()) > 0 {
			if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
				return problemdetail.BadRequest(ctx, err.Error())
			}
		}
		account, err := service.SetAccountActive(ctx.Context(), actor, id, active, req.Reason)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to change account")
		}
		return ctx.JSON(account)
	})
}

func ResetPassword(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		reset, err := service.ResetPassword(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to reset password")
		}
		ctx.Set(fiber.HeaderCacheControl, "no-store")
		return ctx.JSON(reset)
	})
}

func GetOwnAccount(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		account, err := service.GetOwnAccount(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get your account")
		}
		return ctx.JSON(account)
	})
}

func UpdateOwnContact(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var req schema.UpdateOwnContactRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		account, err := service.UpdateOwnContact(ctx.Context(), actor, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to update your contact details")
		}
		return ctx.JSON(account)
	})
}

func ChangeOwnPassword(service services.AccountService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var req schema.ChangeOwnPasswordRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, services.ErrWeakPassword.Error())
		}
		if err := service.ChangeOwnPassword(ctx.Context(), actor, &req); err != nil {
			return errorResponse(ctx, logger, err, "Failed to change your password")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func GetDirectory(service services.ContactService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		directory, err := service.GetDirectory(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to load contacts")
		}
		return ctx.JSON(directory)
	})
}

func UpdateRegionOffice(service services.ContactService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.UpdateRegionOfficeRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if err := service.UpdateRegionOffice(ctx.Context(), actor, id, &req); err != nil {
			return errorResponse(ctx, logger, err, "Failed to update division office")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func UpdateSchoolOffice(service services.ContactService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.UpdateSchoolOfficeRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		if err := service.UpdateSchoolOffice(ctx.Context(), actor, id, &req); err != nil {
			return errorResponse(ctx, logger, err, "Failed to update school contact details")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}
