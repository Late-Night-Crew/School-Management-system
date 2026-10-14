package services

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"unicode"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// AccountService manages regional admin and school manager accounts, and lets every
// user keep their own contact details and password up to date.
//
// Who manages whom:
//
//	super admin    -> every regional admin and school manager
//	regional admin -> school managers of schools in their own region
//
// New accounts and reset passwords get a temporary password, shown once to the admin
// who made it, that must be changed at first sign-in. Accounts are deactivated, never
// deleted, so their history stays readable. A division has at most one active
// regional admin; a school may have several managers.
type AccountService interface {
	ListAccounts(ctx context.Context, actor schema.Actor, filter *schema.AccountFilter) ([]*schema.Account, error)
	CreateAccount(ctx context.Context, actor schema.Actor, req *schema.CreateAccountRequest) (*schema.TemporaryPassword, error)
	UpdateAccount(ctx context.Context, actor schema.Actor, accountID int64, req *schema.UpdateAccountRequest) (*schema.Account, error)
	SetAccountActive(ctx context.Context, actor schema.Actor, accountID int64, active bool, reason string) (*schema.Account, error)
	ResetPassword(ctx context.Context, actor schema.Actor, accountID int64) (*schema.TemporaryPassword, error)

	GetOwnAccount(ctx context.Context, actor schema.Actor) (*schema.Account, error)
	UpdateOwnContact(ctx context.Context, actor schema.Actor, req *schema.UpdateOwnContactRequest) (*schema.Account, error)
	ChangeOwnPassword(ctx context.Context, actor schema.Actor, req *schema.ChangeOwnPasswordRequest) error

	// AuthState reports whether a signed-in user's account is still active and
	// whether they must change their password before doing anything else.
	AuthState(ctx context.Context, userID int64) (active bool, mustChangePassword bool, err error)
}

var (
	ErrAccountForbidden   = errors.New("you are not allowed to manage this account")
	ErrEmailInUse         = errors.New("another account already uses this email address")
	ErrRegionHasAdmin     = errors.New("this division already has an active regional admin; deactivate them first")
	ErrAccountScope       = errors.New("choose the division for a regional admin, or the school for a school manager")
	ErrLastSuperAdmin     = errors.New("this is the only active MCDE account; create or reactivate another before deactivating it")
	ErrAccountScopeGone   = errors.New("this account's school or division has been deleted, so it cannot be reactivated; create a new account instead")
	ErrWrongPassword      = errors.New("your current password is not correct")
	ErrWeakPassword       = errors.New("the new password must be at least 8 characters and include letters and numbers")
	ErrSamePassword       = errors.New("the new password must be different from the current one")
	ErrPasswordChangeOnly = errors.New("you must change your temporary password before continuing")
)

type accountService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewAccountService(queries *dbsqlc.Queries, logger logging.Logger) AccountService {
	return &accountService{queries: queries, logger: logger}
}

func toAccount(row dbsqlc.GetAccountRow) *schema.Account {
	return &schema.Account{
		ID:                 int64(row.ID),
		Name:               row.Name,
		Email:              row.Email,
		Role:               row.Role,
		Phone:              row.Phone.String,
		WhatsApp:           row.Whatsapp.String,
		RegionID:           int64(row.RegionID),
		RegionName:         row.RegionName,
		SchoolID:           int64(row.SchoolID.Int32),
		SchoolName:         row.SchoolName,
		SchoolNumber:       row.SchoolNumber,
		DistrictName:       row.DistrictName,
		Active:             row.Active,
		MustChangePassword: row.MustChangePassword,
		LastLoginAt:        formatNullTime(row.LastLoginAt),
		CreatedAt:          formatNullTime(row.CreatedAt),
	}
}

// canManage reports whether the actor may change the account.
// canManage: super admins manage every account but their own (their own details and
// password are changed under My account); regional admins manage their schools' managers.
func canManage(actor schema.Actor, account *schema.Account) bool {
	switch actor.Role {
	case schema.RoleSuperAdmin:
		return account.ID != actor.UserID
	case schema.RoleRegionalAdmin:
		return account.Role == schema.RoleSchoolManager && account.RegionID == actor.RegionID
	}
	return false
}

func (s *accountService) getAccount(ctx context.Context, accountID int64) (*schema.Account, error) {
	row, err := s.queries.GetAccount(ctx, int32(accountID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get account %d: %w", accountID, err)
	}
	return toAccount(row), nil
}

// getManagedAccount returns the account if the actor may manage it. Accounts outside
// the actor's reach are reported as not found.
func (s *accountService) getManagedAccount(ctx context.Context, actor schema.Actor, accountID int64) (*schema.Account, error) {
	account, err := s.getAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}
	if !canManage(actor, account) {
		return nil, ErrNotFound
	}
	return account, nil
}

func (s *accountService) ListAccounts(ctx context.Context, actor schema.Actor, filter *schema.AccountFilter) ([]*schema.Account, error) {
	params := dbsqlc.ListAccountsParams{
		Role:     common.NullString(filter.Role),
		RegionID: nullID(filter.RegionID),
	}
	switch actor.Role {
	case schema.RoleSuperAdmin:
	case schema.RoleRegionalAdmin:
		params.Role = common.NullString(schema.RoleSchoolManager)
		params.RegionID = nullID(actor.RegionID)
	default:
		return nil, ErrAccountForbidden
	}

	rows, err := s.queries.ListAccounts(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to list accounts: %w", err)
	}
	accounts := make([]*schema.Account, 0, len(rows))
	for _, row := range rows {
		accounts = append(accounts, toAccount(dbsqlc.GetAccountRow(row)))
	}
	return accounts, nil
}

// contactNumbers validates and normalizes a phone and WhatsApp number pair.
func contactNumbers(phone, whatsapp string) (sql.NullString, sql.NullString, error) {
	phone, err := common.NormalizeMalawiPhone(phone)
	if err != nil {
		return sql.NullString{}, sql.NullString{}, err
	}
	whatsapp, err = common.NormalizeMalawiPhone(whatsapp)
	if err != nil {
		return sql.NullString{}, sql.NullString{}, err
	}
	return common.NullString(phone), common.NullString(whatsapp), nil
}

func (s *accountService) checkEmailFree(ctx context.Context, email string, excludeID int64) error {
	count, err := s.queries.CountUsersWithEmail(ctx, dbsqlc.CountUsersWithEmailParams{Email: email, ExcludeID: int32(excludeID)})
	if err != nil {
		return fmt.Errorf("failed to check email: %w", err)
	}
	if count > 0 {
		return ErrEmailInUse
	}
	return nil
}

func (s *accountService) checkRegionFree(ctx context.Context, regionID int64, excludeID int64) error {
	count, err := s.queries.CountActiveRegionalAdmins(ctx, dbsqlc.CountActiveRegionalAdminsParams{
		RegionID:  sql.NullInt32{Int32: int32(regionID), Valid: true},
		ExcludeID: int32(excludeID),
	})
	if err != nil {
		return fmt.Errorf("failed to check division admin: %w", err)
	}
	if count > 0 {
		return ErrRegionHasAdmin
	}
	return nil
}

func (s *accountService) CreateAccount(ctx context.Context, actor schema.Actor, req *schema.CreateAccountRequest) (*schema.TemporaryPassword, error) {
	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	phone, whatsapp, err := contactNumbers(req.Phone, req.WhatsApp)
	if err != nil {
		return nil, err
	}

	params := dbsqlc.CreateAccountParams{
		Name:        name,
		Email:       email,
		Role:        req.Role,
		Phone:       phone,
		Whatsapp:    whatsapp,
		ActorUserID: int32(actor.UserID),
	}
	var scope string
	switch req.Role {
	case schema.RoleSuperAdmin:
		// Another MCDE account (Learner Support Manager): no division or school
		if actor.Role != schema.RoleSuperAdmin {
			return nil, ErrAccountForbidden
		}
		scope = "MCDE"
	case schema.RoleRegionalAdmin:
		if actor.Role != schema.RoleSuperAdmin {
			return nil, ErrAccountForbidden
		}
		if req.RegionID < 1 {
			return nil, ErrAccountScope
		}
		regionName, err := s.queries.GetRegionName(ctx, int32(req.RegionID))
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAccountScope
		}
		if err != nil {
			return nil, fmt.Errorf("failed to look up division %d: %w", req.RegionID, err)
		}
		if err := s.checkRegionFree(ctx, req.RegionID, 0); err != nil {
			return nil, err
		}
		params.RegionID = nullID(req.RegionID)
		scope = regionName + " division"
	case schema.RoleSchoolManager:
		if req.SchoolID < 1 {
			return nil, ErrAccountScope
		}
		school, err := s.queries.GetSchoolScope(ctx, int32(req.SchoolID))
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAccountScope
		}
		if err != nil {
			return nil, fmt.Errorf("failed to look up school %d: %w", req.SchoolID, err)
		}
		allowed := actor.Role == schema.RoleSuperAdmin ||
			(actor.Role == schema.RoleRegionalAdmin && int64(school.RegionID) == actor.RegionID)
		if !allowed {
			return nil, ErrAccountForbidden
		}
		if err := checkSchoolOpen(ctx, s.queries, req.SchoolID); err != nil {
			return nil, err
		}
		params.RegionID = nullID(int64(school.RegionID))
		params.DistrictID = nullID(int64(school.DistrictID))
		params.SchoolID = nullID(int64(school.ID))
		scope = school.Name
	}
	if err := s.checkEmailFree(ctx, email, 0); err != nil {
		return nil, err
	}

	password, hash, err := newTemporaryPassword()
	if err != nil {
		return nil, err
	}
	params.PasswordHash = hash
	params.Note = fmt.Sprintf("%s (%s) for %s", name, email, scope)

	accountID, err := s.queries.CreateAccount(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create account: %w", err)
	}
	account, err := s.getAccount(ctx, int64(accountID))
	if err != nil {
		return nil, err
	}
	return &schema.TemporaryPassword{Account: account, TemporaryPassword: password}, nil
}

func (s *accountService) UpdateAccount(ctx context.Context, actor schema.Actor, accountID int64, req *schema.UpdateAccountRequest) (*schema.Account, error) {
	account, err := s.getManagedAccount(ctx, actor, accountID)
	if err != nil {
		return nil, err
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	phone, whatsapp, err := contactNumbers(req.Phone, req.WhatsApp)
	if err != nil {
		return nil, err
	}
	if err := s.checkEmailFree(ctx, email, accountID); err != nil {
		return nil, err
	}

	note := "Details updated"
	if email != account.Email {
		note = fmt.Sprintf("Email changed from %s to %s", account.Email, email)
	}
	_, err = s.queries.UpdateAccount(ctx, dbsqlc.UpdateAccountParams{
		UserID:      int32(accountID),
		Name:        strings.TrimSpace(req.Name),
		Email:       email,
		Phone:       phone,
		Whatsapp:    whatsapp,
		ActorUserID: int32(actor.UserID),
		Note:        note,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update account %d: %w", accountID, err)
	}
	return s.getAccount(ctx, accountID)
}

func (s *accountService) SetAccountActive(ctx context.Context, actor schema.Actor, accountID int64, active bool, reason string) (*schema.Account, error) {
	account, err := s.getManagedAccount(ctx, actor, accountID)
	if err != nil {
		return nil, err
	}
	// MCDE must always keep at least one working account
	if !active && account.Role == schema.RoleSuperAdmin {
		others, err := s.queries.CountOtherActiveSuperAdmins(ctx, int32(accountID))
		if err != nil {
			return nil, fmt.Errorf("failed to count super admins: %w", err)
		}
		if others == 0 {
			return nil, ErrLastSuperAdmin
		}
	}
	if active && account.Role == schema.RoleRegionalAdmin {
		if account.RegionID == 0 {
			return nil, ErrAccountScopeGone
		}
		if err := s.checkRegionFree(ctx, account.RegionID, accountID); err != nil {
			return nil, err
		}
	}
	if active && account.Role == schema.RoleSchoolManager {
		if account.SchoolID == 0 {
			return nil, ErrAccountScopeGone
		}
		if err := checkSchoolOpen(ctx, s.queries, account.SchoolID); err != nil {
			return nil, err
		}
	}
	_, err = s.queries.SetAccountActive(ctx, dbsqlc.SetAccountActiveParams{
		UserID:      int32(accountID),
		Active:      active,
		ActorUserID: int32(actor.UserID),
		Note:        strings.TrimSpace(reason),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to change account %d: %w", accountID, err)
	}
	return s.getAccount(ctx, accountID)
}

func (s *accountService) ResetPassword(ctx context.Context, actor schema.Actor, accountID int64) (*schema.TemporaryPassword, error) {
	account, err := s.getManagedAccount(ctx, actor, accountID)
	if err != nil {
		return nil, err
	}
	password, hash, err := newTemporaryPassword()
	if err != nil {
		return nil, err
	}
	_, err = s.queries.ResetAccountPassword(ctx, dbsqlc.ResetAccountPasswordParams{
		UserID:       int32(accountID),
		PasswordHash: hash,
		ActorUserID:  int32(actor.UserID),
		Note:         "Temporary password issued for " + account.Email,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to reset password for account %d: %w", accountID, err)
	}
	account, err = s.getAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}
	return &schema.TemporaryPassword{Account: account, TemporaryPassword: password}, nil
}

func (s *accountService) GetOwnAccount(ctx context.Context, actor schema.Actor) (*schema.Account, error) {
	return s.getAccount(ctx, actor.UserID)
}

func (s *accountService) UpdateOwnContact(ctx context.Context, actor schema.Actor, req *schema.UpdateOwnContactRequest) (*schema.Account, error) {
	phone, whatsapp, err := contactNumbers(req.Phone, req.WhatsApp)
	if err != nil {
		return nil, err
	}
	_, err = s.queries.UpdateOwnContact(ctx, dbsqlc.UpdateOwnContactParams{
		UserID:   int32(actor.UserID),
		Phone:    phone,
		Whatsapp: whatsapp,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update contact details: %w", err)
	}
	return s.getAccount(ctx, actor.UserID)
}

func (s *accountService) ChangeOwnPassword(ctx context.Context, actor schema.Actor, req *schema.ChangeOwnPasswordRequest) error {
	current, err := s.queries.GetUserPassword(ctx, int32(actor.UserID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to check password: %w", err)
	}
	if !common.CheckPasswordHash(req.CurrentPassword, current) {
		return ErrWrongPassword
	}
	if !strongEnough(req.NewPassword) {
		return ErrWeakPassword
	}
	if req.NewPassword == req.CurrentPassword {
		return ErrSamePassword
	}
	hash, err := common.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	err = s.queries.ChangeOwnPassword(ctx, dbsqlc.ChangeOwnPasswordParams{PasswordHash: hash, UserID: int32(actor.UserID)})
	if err != nil {
		return fmt.Errorf("failed to change password: %w", err)
	}
	return nil
}

func (s *accountService) AuthState(ctx context.Context, userID int64) (bool, bool, error) {
	state, err := s.queries.GetAuthUserState(ctx, int32(userID))
	if errors.Is(err, sql.ErrNoRows) {
		return false, false, nil
	}
	if err != nil {
		return false, false, fmt.Errorf("failed to check account %d: %w", userID, err)
	}
	return state.Active, state.MustChangePassword, nil
}

// strongEnough requires 8+ characters with at least one letter and one digit.
func strongEnough(password string) bool {
	var letter, digit bool
	for _, r := range password {
		letter = letter || unicode.IsLetter(r)
		digit = digit || unicode.IsDigit(r)
	}
	return len(password) >= 8 && letter && digit
}

// Letters and digits that are hard to confuse when read out or copied by hand.
const temporaryPasswordAlphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

// newTemporaryPassword returns a random 10-character password and its hash.
// NewTemporaryPassword returns a random temporary password and its hash, for the
// command-line tools that create or reset accounts outside the API.
func NewTemporaryPassword() (password, hash string, err error) {
	return newTemporaryPassword()
}

func newTemporaryPassword() (string, string, error) {
	for {
		buf := make([]byte, 10)
		for i := range buf {
			n, err := rand.Int(rand.Reader, big.NewInt(int64(len(temporaryPasswordAlphabet))))
			if err != nil {
				return "", "", fmt.Errorf("failed to generate password: %w", err)
			}
			buf[i] = temporaryPasswordAlphabet[n.Int64()]
		}
		password := string(buf)
		if !strongEnough(password) {
			continue
		}
		hash, err := common.HashPassword(password)
		if err != nil {
			return "", "", fmt.Errorf("failed to hash password: %w", err)
		}
		return password, hash, nil
	}
}
