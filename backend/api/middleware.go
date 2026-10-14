package api

import (
	"fmt"
	"os"
	"runtime/debug"

	"nsms/common"
	"nsms/pkg/problemdetail"
	"nsms/schema"
	"nsms/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/pprof"
	"github.com/gofiber/fiber/v2/middleware/recover"
	jwtware "github.com/gofiber/jwt/v2"
)

func (api *API) middleware() {
	app := api.app

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // TODO: use cors origins from configuration
		AllowMethods: "*",
	}))
	if api.Config.Environment == "DEVELOPMENT" {
		app.Use(pprof.New())
	}
	// Gzip responses for browsers that accept it: JSON shrinks several times, which
	// matters to coordinators on mobile data
	app.Use(compress.New())

	app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
		StackTraceHandler: func(c *fiber.Ctx, e interface{}) {
			if api.logger != nil {
				api.logger.Error("failed to process a request", "errorStackTrace", fmt.Sprintf("panic: %v\n%s\n", e, debug.Stack()))
			} else {
				_, _ = os.Stderr.WriteString(fmt.Sprintf("panic: %v\n%s\n", e, debug.Stack())) //nolint:errcheck
			}
		},
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))
}

// RequireAuthentication accepts a request with a valid token whose account is still
// active. A deactivated account is refused at once, even with an unexpired token.
// While an account has a temporary password, only reading the account and changing
// the password are allowed.
func RequireAuthentication(signingKey []byte, accounts services.AccountService) fiber.Handler {
	return jwtware.New(jwtware.Config{
		// Only the header: tokens in URLs leak into proxy logs, and a cookie would
		// make cross-site requests carry the session
		TokenLookup:  "header:Authorization",
		SigningKey:   signingKey,
		ErrorHandler: jwtError,
		SuccessHandler: func(ctx *fiber.Ctx) error {
			userID, err := common.GetUserIDFromCtx(ctx)
			if err != nil {
				return problemdetail.Unauthorized(ctx, "Missing user in token")
			}
			active, mustChangePassword, err := accounts.AuthState(ctx.Context(), userID)
			if err != nil {
				return problemdetail.ServerErrorProblem(ctx, "Failed to check your account")
			}
			if !active {
				return problemdetail.Unauthorized(ctx, "This account has been deactivated")
			}
			// Lets services record who made a change (see services.ActorKey)
			ctx.Context().SetUserValue(services.ActorKey, userID)
			if mustChangePassword && !allowedWithTemporaryPassword(ctx) {
				return ctx.Status(fiber.StatusForbidden).JSON(problemdetail.ProblemDetail{
					Type:   "problemdetail.example.com/http/types/PasswordChangeRequired",
					Title:  "Password change required",
					Detail: services.ErrPasswordChangeOnly.Error(),
				})
			}
			return ctx.Next()
		},
	})
}

func allowedWithTemporaryPassword(ctx *fiber.Ctx) bool {
	path := ctx.Path()
	return (ctx.Method() == fiber.MethodGet && path == "/account/me") ||
		(ctx.Method() == fiber.MethodPost && path == "/account/password")
}

func jwtError(c *fiber.Ctx, err error) error {
	if err.Error() == "Missing or malformed JWT" {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"status": "error", "message": "Missing or malformed JWT", "data": nil})
	}
	return c.Status(fiber.StatusUnauthorized).
		JSON(fiber.Map{"status": "error", "message": "Invalid or expired JWT", "data": nil})
}

// RequireRole allows the request only when the token's role is one of roles.
// It must run after RequireAuthentication.
func RequireRole(roles ...string) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		role, err := common.GetRoleFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "Missing role in token")
		}
		for _, allowed := range roles {
			if role == allowed {
				return ctx.Next()
			}
		}
		return problemdetail.Forbidden(ctx, "Your role is not allowed to access this resource")
	}
}

// RequireSchoolAccess allows the request only for school managers whose token
// school_id matches the :school_id path parameter.
// It must run after RequireAuthentication.
func RequireSchoolAccess() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		role, err := common.GetRoleFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "Missing role in token")
		}
		if role != schema.RoleSchoolManager {
			return problemdetail.Forbidden(ctx, "School manager access required")
		}

		pathSchoolID, err := common.ParseIDFromCtx(ctx, "school_id")
		if err != nil || pathSchoolID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid school ID")
		}
		tokenSchoolID, err := common.GetSchoolIDFromCtx(ctx)
		if err != nil || tokenSchoolID != pathSchoolID {
			return problemdetail.Forbidden(ctx, "Forbidden school access")
		}
		return ctx.Next()
	}
}

// RequireRegionAccess allows the request only for regional admins whose token
// region_id matches the :region_id path parameter.
// It must run after RequireAuthentication.
func RequireRegionAccess() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		role, err := common.GetRoleFromCtx(ctx)
		if err != nil {
			return problemdetail.Unauthorized(ctx, "Missing role in token")
		}
		if role != schema.RoleRegionalAdmin {
			return problemdetail.Forbidden(ctx, "Regional admin access required")
		}

		pathRegionID, err := common.ParseIDFromCtx(ctx, "region_id")
		if err != nil || pathRegionID < 1 {
			return problemdetail.BadRequest(ctx, "Invalid region ID")
		}
		tokenRegionID, err := common.GetRegionIDFromCtx(ctx)
		if err != nil || tokenRegionID != pathRegionID {
			return problemdetail.Forbidden(ctx, "Forbidden region access")
		}
		return ctx.Next()
	}
}
