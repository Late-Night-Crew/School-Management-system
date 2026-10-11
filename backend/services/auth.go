package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"nsms/common"
	"nsms/config"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

var ErrUserAlreadyExists = errors.New("user with given email already exists")

type AuthService interface {
	SignIn(*schema.LoginRequest) (*schema.LoginResponse, error)
	// SignUp(*schema.SignUpRequest) (*schema.LoginResponse, error)
	// ResetPassword(ctx context.Context, email string) error
	// ChangePassword(ctx context.Context, request *schema.ChangePasswordRequest) error
	// SendOTP(ctx context.Context, phoneNumber string) error
}

type authServiceImpl struct {
	authConfig *config.AuthConfiguration
	queries    *dbsqlc.Queries
	logger     logging.Logger
}

func NewAuthService(authConfig *config.AuthConfiguration, db *dbsqlc.Queries, logger logging.Logger) AuthService {
	return &authServiceImpl{
		authConfig: authConfig,
		queries:    db,
		logger:     logger,
	}
}

func generateJWTToken(res *schema.LoginResponse, expireAfter int64) *jwt.Token {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = res.UserID
	claims["email"] = res.Email
	claims["name"] = res.DisplayName
	claims["role"] = res.Role
	claims["region_id"] = res.RegionID
	claims["district_id"] = res.DistrictID
	claims["school_id"] = res.SchoolID
	claims["iat"] = time.Now().Unix()
	claims["exp"] = expireAfter
	return token
}

func (a authServiceImpl) SignIn(request *schema.LoginRequest) (*schema.LoginResponse, error) {
	email := strings.ToLower(strings.TrimSpace(request.Email))
	user, err := a.queries.FindUserLoginByEmail(context.Background(), email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			a.logger.Debug("auth-service", "failed to find user from login request", "email", email)
			return nil, ErrInvalidCredentials
		}
		a.logger.Error("auth-service", "failed to process the login request", "error", err)
		return nil, err
	}

	if !common.CheckPasswordHash(request.Password, user.Password) {
		a.logger.Debug("auth-service", "invalid password provided", "email", email)
		return nil, ErrInvalidCredentials
	}

	var regionID, districtID, schoolID *int64

	if user.RegionID.Valid {
		val := int64(user.RegionID.Int32)
		regionID = &val
	}
	if user.DistrictID.Valid {
		val := int64(user.DistrictID.Int32)
		districtID = &val
	}
	if user.SchoolID.Valid {
		val := int64(user.SchoolID.Int32)
		schoolID = &val
	}

	res := &schema.LoginResponse{
		UserID:      int64(user.ID),
		DisplayName: user.DisplayName,
		Email:       user.Email,
		Role:        user.Role,
		RegionID:    regionID,
		DistrictID:  districtID,
		SchoolID:    schoolID,
		ExpiresAt:   0,

		MustChangePassword: user.MustChangePassword,
	}
	if err := a.queries.RecordLogin(context.Background(), user.ID); err != nil {
		a.logger.Error("auth-service", "failed to record login", "user_id", user.ID, "error", err)
	}

	token := generateJWTToken(res, time.Now().Add(time.Hour*6).Unix())
	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))
	if err != nil {
		a.logger.Error("auth-service", "failed to create a token", "error", err)
		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
	}

	res.Token = tokenStr
	return res, nil
}

// func (a *authServiceImpl) SignUp(request *schema.SignUpRequest) (*schema.LoginResponse, error) {
// 	_, err := a.queries.FindUserLoginByEmail(context.Background(), request.Email)
// 	if err == nil {
// 		// User already exists
// 		return nil, ErrUserAlreadyExists
// 	}
// 	if !errors.Is(err, sql.ErrNoRows) {
// 		// Some other DB error occurred
// 		a.logger.Error("auth-service", "unexpected error finding user", "email", request.Email, "error", err)
// 		return nil, err
// 	}

// 	userParams := dbsqlc.CreateUserParams{
// 		FirstName:    request.FirstName,
// 		LastName:     request.LastName,
// 		DisplayName:  common.NullString(request.DisplayName),
// 		Email:        request.Email,
// 		Password:     common.MustHashPassword(request.Password),
// 		IsActivated:  common.TrueNullBool(),
// 		IsReviewed:   common.FalseNullBool(),
// 		IsSuperAdmin: common.FalseNullBool(),
// 		Role:         request.Role,
// 		Status:       request.Status,
// 		IsVerified:   common.FalseNullBool(),
// 		CreatedAt:    common.NullTime(time.Now()),
// 		UpdatedAt:    common.NullTime(time.Now()),
// 	}

// 	userID, err := a.queries.CreateUser(context.Background(), userParams)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to create user got %v", err)
// 	}

// 	res := &schema.LoginResponse{
// 		UserID:      int64(userID),
// 		DisplayName: request.DisplayName,
// 		Email:       request.Email,
// 		ExpiresAt:   0,
// 	}

// 	token := generateJWTToken(res, time.Now().Add(time.Hour*6).Unix())
// 	tokenStr, err := token.SignedString([]byte(a.authConfig.JwtSecretKey))
// 	if err != nil {
// 		a.logger.Error("auth-service", "failed to create a token", "error", err)
// 		return nil, fmt.Errorf("failed to generate auth token, got: %v", err)
// 	}

// 	res.Token = tokenStr
// 	return res, nil
// }

func (a *authServiceImpl) ResetPassword(ctx context.Context, email string) error {
	panic("not implemented")
}

func (a *authServiceImpl) ChangePassword(ctx context.Context, request *schema.ChangePasswordRequest) error {
	panic("not implemented")
}

func (a *authServiceImpl) SendOTP(ctx context.Context, phoneNumber string) error {
	panic("not implemented")
}
