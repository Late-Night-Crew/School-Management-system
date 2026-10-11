package common

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"nsms/schema"
)

var ErrSchoolIDMissing = errors.New("school_id claim missing")
var ErrRegionIDMissing = errors.New("region_id claim missing")
var ErrUserIDMissing = errors.New("user_id claim missing")

var ErrRoleMissing = errors.New("role claim missing")

func claimsFromCtx(ctx *fiber.Ctx) (jwt.MapClaims, error) {
	user := ctx.Locals("user")
	if user == nil {
		return nil, errors.New("token not found in context")
	}

	token, ok := user.(*jwt.Token)
	if !ok {
		return nil, errors.New("invalid token in context")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}

// GetRoleFromCtx returns the "role" claim of the authenticated user's token.
func GetRoleFromCtx(ctx *fiber.Ctx) (string, error) {
	claims, err := claimsFromCtx(ctx)
	if err != nil {
		return "", err
	}
	role, ok := claims["role"].(string)
	if !ok || role == "" {
		return "", ErrRoleMissing
	}
	return role, nil
}

func GetSchoolIDFromCtx(ctx *fiber.Ctx) (int64, error) {
	return idClaimFromCtx(ctx, "school_id", ErrSchoolIDMissing)
}

// GetUserIDFromCtx returns the "user_id" claim of the authenticated user's token.
func GetUserIDFromCtx(ctx *fiber.Ctx) (int64, error) {
	return idClaimFromCtx(ctx, "user_id", ErrUserIDMissing)
}

// GetRegionIDFromCtx returns the "region_id" claim of the authenticated user's token.
func GetRegionIDFromCtx(ctx *fiber.Ctx) (int64, error) {
	return idClaimFromCtx(ctx, "region_id", ErrRegionIDMissing)
}

// idClaimFromCtx reads a numeric ID claim, returning errMissing when it is absent or empty.
func idClaimFromCtx(ctx *fiber.Ctx, name string, errMissing error) (int64, error) {
	claims, err := claimsFromCtx(ctx)
	if err != nil {
		return 0, err
	}

	raw, ok := claims[name]
	if !ok || raw == nil {
		return 0, errMissing
	}

	switch v := raw.(type) {
	case float64:
		return int64(v), nil
	case int64:
		return v, nil
	case string:
		if v == "" {
			return 0, errMissing
		}
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return 0, err
		}
		return parsed, nil
	default:
		return 0, fmt.Errorf("invalid %s claim type", name)
	}
}

// GetActorFromCtx returns the signed-in user with the region or school they act for.
func GetActorFromCtx(ctx *fiber.Ctx) (schema.Actor, error) {
	role, err := GetRoleFromCtx(ctx)
	if err != nil {
		return schema.Actor{}, err
	}
	userID, err := GetUserIDFromCtx(ctx)
	if err != nil {
		return schema.Actor{}, err
	}
	actor := schema.Actor{UserID: userID, Role: role}
	switch role {
	case schema.RoleSuperAdmin:
	case schema.RoleRegionalAdmin:
		actor.RegionID, err = GetRegionIDFromCtx(ctx)
	case schema.RoleSchoolManager:
		actor.SchoolID, err = GetSchoolIDFromCtx(ctx)
	default:
		err = errors.New("unknown role")
	}
	if err == nil && actor.Party().Type != schema.PartySuperAdmin && actor.Party().ID < 1 {
		err = errors.New("missing region or school in token")
	}
	return actor, err
}
