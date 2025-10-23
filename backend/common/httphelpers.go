package common

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/microcosm-cc/bluemonday"
	"nsms/validation"
)

func ParseBodyThenValidate(ctx *fiber.Ctx, v any) (bool, error) {
	err := ctx.BodyParser(v)
	if err != nil {
		return false, err
	}

	errors := validation.ValidateStruct(v)
	if errors != nil {
		return true, errors
	}

	return false, nil
}

func ParseQueryParamsThenValidate(ctx *fiber.Ctx, v any) error {
	err := ctx.QueryParser(v)
	if err != nil {
		return err
	}

	errors := validation.ValidateStruct(v)
	if errors != nil {
		return errors
	}

	return nil
}

func NewConflictError(message string) error {
	return fiber.NewError(fiber.StatusConflict, message)
}

func ParseIDParam(ctx *fiber.Ctx, paramName string) (int64, error) {
	idStr := ctx.Params(paramName, "0")
	id, err := strconv.Atoi(idStr)
	return int64(id), err
}

func ParseIDFromCtx(ctx *fiber.Ctx, paramName string) (int64, error) {
	idStr := ctx.Params(paramName, "0")
	id, err := strconv.Atoi(idStr)
	return int64(id), err
}

var policy = bluemonday.UGCPolicy()

func SanitizeInputData(inputData string) string {
	return policy.Sanitize(inputData)
}
