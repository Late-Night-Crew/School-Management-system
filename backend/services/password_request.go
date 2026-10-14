package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// PasswordRequestService handles "forgot password" requests. Without an email service,
// the office above the person resets the password: MCDE for division officers, the
// division for school users. The super admin sees every request, as a fallback.
type PasswordRequestService interface {
	// Request records a request if the details match an active account. It returns
	// nil either way, so the sign-in page cannot reveal who has an account.
	Request(ctx context.Context, req *schema.PasswordRequest, ip string) error
	PublicPlaces(ctx context.Context) (*schema.PublicPlaces, error)
	List(ctx context.Context, actor schema.Actor) ([]*schema.PasswordRequestItem, error)
	// Resolve gives the account a temporary password and closes the request.
	Resolve(ctx context.Context, actor schema.Actor, requestID int64) (*schema.TemporaryPassword, error)
	Dismiss(ctx context.Context, actor schema.Actor, requestID int64) error
}

type passwordRequestService struct {
	queries  *dbsqlc.Queries
	accounts AccountService
	logger   logging.Logger
}

func NewPasswordRequestService(queries *dbsqlc.Queries, accounts AccountService, logger logging.Logger) PasswordRequestService {
	return &passwordRequestService{queries: queries, accounts: accounts, logger: logger}
}

func (s *passwordRequestService) Request(ctx context.Context, req *schema.PasswordRequest, ip string) error {
	phone, err := common.NormalizeMalawiPhone(strings.TrimSpace(req.ContactPhone))
	if err != nil {
		return err
	}
	params := dbsqlc.FindAccountForPasswordRequestParams{Email: strings.TrimSpace(req.Email), Role: req.Role}
	if req.Role == schema.RoleRegionalAdmin {
		params.RegionID = nullID(req.RegionID)
	} else {
		params.SchoolID = nullID(req.SchoolID)
	}
	account, err := s.queries.FindAccountForPasswordRequest(ctx, params)
	if errors.Is(err, sql.ErrNoRows) {
		s.logger.Info("password-requests", "forgot-password request did not match an account", "role", req.Role, "ip", ip)
		return nil
	}
	if err != nil {
		return fmt.Errorf("failed to look up account for password request: %w", err)
	}
	err = s.queries.CreatePasswordRequest(ctx, dbsqlc.CreatePasswordRequestParams{
		UserID:          account.ID,
		HandlerRegionID: nullID(int64(account.HandlerRegionID)),
		ContactPhone:    common.NullString(phone),
		Note:            common.NullString(strings.TrimSpace(req.Note)),
		RequesterIp:     common.NullString(ip),
	})
	if err != nil {
		return fmt.Errorf("failed to record password request: %w", err)
	}
	return nil
}

func (s *passwordRequestService) PublicPlaces(ctx context.Context) (*schema.PublicPlaces, error) {
	regions, err := s.queries.ListPublicRegions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list divisions: %w", err)
	}
	schools, err := s.queries.ListPublicSchools(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list schools: %w", err)
	}
	places := &schema.PublicPlaces{
		Regions: make([]schema.PublicPlace, 0, len(regions)),
		Schools: make([]schema.PublicPlace, 0, len(schools)),
	}
	for _, r := range regions {
		places.Regions = append(places.Regions, schema.PublicPlace{ID: int64(r.ID), Name: r.Name})
	}
	for _, sc := range schools {
		places.Schools = append(places.Schools, schema.PublicPlace{ID: int64(sc.ID), Name: sc.Name, RegionID: int64(sc.RegionID)})
	}
	return places, nil
}

// handlerFilter: the super admin handles every request, a division officer their
// division's school users.
func handlerFilter(actor schema.Actor) (sql.NullInt32, error) {
	switch actor.Role {
	case schema.RoleSuperAdmin:
		return sql.NullInt32{}, nil
	case schema.RoleRegionalAdmin:
		return nullID(actor.RegionID), nil
	}
	return sql.NullInt32{}, ErrAccountForbidden
}

func (s *passwordRequestService) List(ctx context.Context, actor schema.Actor) ([]*schema.PasswordRequestItem, error) {
	filter, err := handlerFilter(actor)
	if err != nil {
		return nil, err
	}
	rows, err := s.queries.ListPasswordRequests(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list password requests: %w", err)
	}
	items := make([]*schema.PasswordRequestItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, &schema.PasswordRequestItem{
			ID:           int64(row.ID),
			AccountID:    int64(row.UserID),
			Name:         row.Name,
			Email:        row.Email,
			Role:         row.Role,
			SchoolName:   row.SchoolName,
			RegionName:   row.RegionName,
			Phone:        row.Phone.String,
			WhatsApp:     row.Whatsapp.String,
			ContactPhone: row.ContactPhone.String,
			Note:         row.Note.String,
			CreatedAt:    row.CreatedAt.Format(transferTimeFormat),
		})
	}
	return items, nil
}

// pendingFor returns the request if it is pending and the actor handles it.
func (s *passwordRequestService) pendingFor(ctx context.Context, actor schema.Actor, requestID int64) (*dbsqlc.GetPasswordRequestRow, error) {
	filter, err := handlerFilter(actor)
	if err != nil {
		return nil, err
	}
	request, err := s.queries.GetPasswordRequest(ctx, int32(requestID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get password request %d: %w", requestID, err)
	}
	if filter.Valid && (!request.HandlerRegionID.Valid || request.HandlerRegionID.Int32 != filter.Int32) {
		return nil, ErrNotFound
	}
	if request.Status != "Pending" {
		return nil, newUserError(ErrInUse, "This request has already been dealt with.")
	}
	return &request, nil
}

func (s *passwordRequestService) Resolve(ctx context.Context, actor schema.Actor, requestID int64) (*schema.TemporaryPassword, error) {
	request, err := s.pendingFor(ctx, actor, requestID)
	if err != nil {
		return nil, err
	}
	issued, err := s.accounts.ResetPassword(ctx, actor, int64(request.UserID))
	if err != nil {
		return nil, err
	}
	if err := s.close(ctx, actor, requestID, "Resolved"); err != nil {
		return nil, err
	}
	return issued, nil
}

func (s *passwordRequestService) Dismiss(ctx context.Context, actor schema.Actor, requestID int64) error {
	if _, err := s.pendingFor(ctx, actor, requestID); err != nil {
		return err
	}
	return s.close(ctx, actor, requestID, "Dismissed")
}

func (s *passwordRequestService) close(ctx context.Context, actor schema.Actor, requestID int64, status string) error {
	_, err := s.queries.ClosePasswordRequest(ctx, dbsqlc.ClosePasswordRequestParams{
		RequestID:   int32(requestID),
		Status:      status,
		ActorUserID: int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return newUserError(ErrInUse, "This request has already been dealt with.")
	}
	if err != nil {
		return fmt.Errorf("failed to close password request %d: %w", requestID, err)
	}
	return nil
}
