package admin

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

// Usage, delete, move and close for schools, districts and divisions (regions).

// structureErrorResponse maps the errors these actions return to problem details.
func structureErrorResponse(ctx *fiber.Ctx, logger logging.Logger, err error, fallback string) error {
	switch {
	case errors.Is(err, services.ErrNotFound):
		return problemdetail.NotFound(ctx, "Not found")
	case errors.Is(err, services.ErrInUse):
		return problemdetail.Conflict(ctx, err.Error())
	case errors.Is(err, services.ErrInvalidMove):
		return problemdetail.BadRequest(ctx, err.Error())
	}
	logger.Error(loggedmodule.AdminRequests, fallback, "error", err)
	return problemdetail.ServerErrorProblem(ctx, fallback)
}

func pathID(ctx *fiber.Ctx) (int64, error) {
	id, err := common.ParseIDParam(ctx, "id")
	if err != nil || id < 1 {
		return 0, problemdetail.BadRequest(ctx, "Invalid ID")
	}
	return id, nil
}

func GetSchoolUsage(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		usage, err := schoolService.GetSchoolUsage(ctx.Context(), id)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to check school records")
		}
		return ctx.JSON(usage)
	}
}

func CloseSchool(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		var req schema.CloseSchoolRequest
		if len(ctx.Body()) > 0 {
			if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
				return problemdetail.BadRequest(ctx, err.Error())
			}
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		result, err := schoolService.CloseSchool(ctx.Context(), id, userID, req.Note)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to close school")
		}
		return ctx.JSON(result)
	}
}

func ReopenSchool(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		if err := schoolService.ReopenSchool(ctx.Context(), id, userID); err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to reopen school")
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	}
}

func GetDistrictUsage(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		usage, err := districtService.GetDistrictUsage(ctx.Context(), id)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to check district records")
		}
		return ctx.JSON(usage)
	}
}

func MoveDistrictSchools(districtService services.DistrictService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		var req schema.MoveSchoolsRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		result, err := districtService.MoveSchools(ctx.Context(), id, req.ToDistrictID, userID)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to move schools")
		}
		return ctx.JSON(result)
	}
}

func GetRegionUsage(regionService services.RegionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		usage, err := regionService.GetRegionUsage(ctx.Context(), id)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to check division records")
		}
		return ctx.JSON(usage)
	}
}

func MoveRegionDistricts(regionService services.RegionService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		var req schema.MoveDistrictsRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		result, err := regionService.MoveDistricts(ctx.Context(), id, req.ToRegionID, userID)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to move districts")
		}
		return ctx.JSON(result)
	}
}

func TransferAllStudents(schoolService services.SchoolService, logger logging.Logger) fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		id, err := pathID(ctx)
		if err != nil {
			return err
		}
		var req schema.TransferAllStudentsRequest
		if _, err := common.ParseBodyThenValidate(ctx, &req); err != nil {
			return problemdetail.BadRequest(ctx, err.Error())
		}
		userID, _ := common.GetUserIDFromCtx(ctx)
		result, err := schoolService.TransferAllStudents(ctx.Context(), id, userID, &req)
		if err != nil {
			return structureErrorResponse(ctx, logger, err, "Failed to transfer students")
		}
		return ctx.JSON(result)
	}
}
