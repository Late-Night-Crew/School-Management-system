package common

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

var ErrSchoolIDMissing = errors.New("school_id claim missing")

func GetSchoolIDFromCtx(ctx *fiber.Ctx) (int64, error) {
	user := ctx.Locals("user")
	if user == nil {
		return 0, errors.New("token not found in context")
	}

	token, ok := user.(*jwt.Token)
	if !ok {
		return 0, errors.New("invalid token in context")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}

	rawSchoolID, ok := claims["school_id"]
	if !ok || rawSchoolID == nil {
		return 0, ErrSchoolIDMissing
	}

	switch v := rawSchoolID.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	case string:
		if v == "" {
			return 0, ErrSchoolIDMissing
		}
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return 0, err
		}
		return parsed, nil
	default:
		return 0, errors.New("invalid school_id claim type")
	}
}
