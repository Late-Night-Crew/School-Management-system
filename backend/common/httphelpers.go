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

func ParseIDFromCtx(ctx *fiber.Ctx, paramName string) (int64, error) {
	idStr := ctx.Params(paramName, "0")
	id, err := strconv.Atoi(idStr)
	return int64(id), err
}

var policy = bluemonday.UGCPolicy()

func SanitizeInputData(inputData string) string {
	return policy.Sanitize(inputData)
}
