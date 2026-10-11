// Package comms serves notices and conversations for every role. Who the caller
// speaks for (the ministry, a regional office or a school) comes from their token,
// never from the request.
package comms

import (
	"errors"
	"net/http"

	"nsms/common"
	"nsms/logging"
	"nsms/logging/loggedmodule"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
)

// withActor resolves the caller before running the handler.
func withActor(handle func(ctx *fiber.Ctx, actor schema.Actor) error) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		actor, err := common.GetActorFromCtx(ctx)
		if err != nil {
			return problemdetail.Forbidden(ctx, "Your account is not set up to use messages")
		}
		return handle(ctx, actor)
	}
}

func errorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Not found")
	case errors.Is(err, services.ErrCommsForbidden), errors.Is(err, services.ErrNoticeNotForSending):
		return problemdetail.Forbidden(ctx, err.Error())
	case errors.Is(err, services.ErrCommsRateLimited):
		return ctx.Status(http.StatusTooManyRequests).JSON(problemdetail.ProblemDetail{
			Type:   "problemdetail.example.com/http/types/TooManyRequests",
			Title:  "Too Many Requests",
			Detail: err.Error(),
		})
	case errors.Is(err, services.ErrNoRecipients),
		errors.Is(err, services.ErrDueDateInPast),
		errors.Is(err, services.ErrSelfConversation),
		errors.Is(err, services.ErrEmptyCommsText):
		return problemdetail.BadRequest(ctx, err.Error())
	case errors.Is(err, services.ErrNothingPending),
		errors.Is(err, services.ErrNoticeWithdrawn),
		errors.Is(err, services.ErrAlreadyReported):
		return problemdetail.Conflict(ctx, err.Error())
	}
	logger.Error(loggedmodule.Comms, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func idParam(ctx *fiber.Ctx) (int64, error) {
	id, err := common.ParseIDParam(ctx, "id")
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid ID")
	}
	return id, nil
}

func GetSummary(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		summary, err := service.GetSummary(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get message counts")
		}
		return ctx.JSON(summary)
	})
}

func PreviewAudience(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var query schema.AudienceQuery
		if err := common.ParseQueryParamsThenValidate(ctx, &query); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		count, err := service.PreviewAudience(ctx.Context(), actor, query.AudienceType, query.AudienceID)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to preview recipients")
		}
		return ctx.JSON(schema.AudiencePreview{RecipientCount: count})
	})
}

func SendNotice(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var req schema.CreateNoticeRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		sent, err := service.SendNotice(ctx.Context(), actor, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to send notice")
		}
		return ctx.Status(fiber.StatusCreated).JSON(sent)
	})
}

func RemindPending(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		sent, err := service.RemindPending(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to send reminder")
		}
		return ctx.Status(fiber.StatusCreated).JSON(sent)
	})
}

func WithdrawNotice(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.WithdrawNoticeRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "A reason for withdrawing is required")
		}
		if err := service.WithdrawNotice(ctx.Context(), actor, id, req.Reason); err != nil {
			return errorResponse(ctx, logger, err, "Failed to withdraw notice")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func ListInbox(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		notices, err := service.ListInbox(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list notices")
		}
		return ctx.JSON(notices)
	})
}

func ListSent(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		notices, err := service.ListSent(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list sent notices")
		}
		return ctx.JSON(notices)
	})
}

func ListRecipients(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		recipients, err := service.ListRecipients(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list recipients")
		}
		return ctx.JSON(recipients)
	})
}

func MarkNoticeRead(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		if err := service.MarkNoticeRead(ctx.Context(), actor, id); err != nil {
			return errorResponse(ctx, logger, err, "Failed to mark notice read")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func MarkNoticeDone(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		if err := service.MarkNoticeDone(ctx.Context(), actor, id); err != nil {
			return errorResponse(ctx, logger, err, "Failed to mark notice done")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}

func ListContacts(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		contacts, err := service.ListContacts(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list contacts")
		}
		return ctx.JSON(contacts)
	})
}

func StartConversation(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		var req schema.CreateConversationRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		conversation, err := service.StartConversation(ctx.Context(), actor, &req)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to start conversation")
		}
		return ctx.Status(fiber.StatusCreated).JSON(conversation)
	})
}

func ListConversations(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		conversations, err := service.ListConversations(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list conversations")
		}
		return ctx.JSON(conversations)
	})
}

func ListReportedConversations(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		conversations, err := service.ListReportedConversations(ctx.Context(), actor)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to list reported conversations")
		}
		return ctx.JSON(conversations)
	})
}

func GetConversation(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		conversation, err := service.GetConversation(ctx.Context(), actor, id)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to get conversation")
		}
		return ctx.JSON(conversation)
	})
}

func SendMessage(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.SendMessageRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		conversation, err := service.SendMessage(ctx.Context(), actor, id, req.Body)
		if err != nil {
			return errorResponse(ctx, logger, err, "Failed to send message")
		}
		return ctx.Status(fiber.StatusCreated).JSON(conversation)
	})
}

func ReportConversation(service services.CommsService, logger logging.Logger) fiber.Handler {
	return withActor(func(ctx *fiber.Ctx, actor schema.Actor) error {
		id, err := idParam(ctx)
		if err != nil {
			return err
		}
		var req schema.ReportConversationRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, "A reason for the report is required")
		}
		if err := service.ReportConversation(ctx.Context(), actor, id, req.Reason); err != nil {
			return errorResponse(ctx, logger, err, "Failed to report conversation")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
}
