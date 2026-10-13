package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// ErrRequestIncomplete wraps the list of what a request still needs before it can be
// submitted; the message is for the user.
var ErrRequestIncomplete = errors.New("request incomplete")

// ErrRequestForbidden means the actor may not act on this request (another division's,
// or a step for a different role).
var ErrRequestForbidden = errors.New("you cannot do this to this school request")

// SchoolRequestService handles requests to register a new school: division officers
// fill in and submit them for their own division, the super admin accepts them. MCDE
// does not reject applications.
type SchoolRequestService interface {
	ListRequests(ctx context.Context, actor schema.Actor, filter schema.SchoolRequestFilter) ([]*schema.SchoolRequest, error)
	GetRequest(ctx context.Context, actor schema.Actor, requestID int64) (*schema.SchoolRequest, error)
	CreateRequest(ctx context.Context, actor schema.Actor, form *schema.SchoolRequestForm) (*schema.SchoolRequest, error)
	// UpdateRequest saves a draft.
	UpdateRequest(ctx context.Context, actor schema.Actor, requestID int64, form *schema.SchoolRequestForm) (*schema.SchoolRequest, error)
	// SubmitRequest sends a complete draft to the super admin.
	SubmitRequest(ctx context.Context, actor schema.Actor, requestID int64) (*schema.SchoolRequest, error)
	DeleteRequest(ctx context.Context, actor schema.Actor, requestID int64) error
	// AcceptRequest creates the school and the coordinator's school manager account.
	AcceptRequest(ctx context.Context, actor schema.Actor, requestID int64, req *schema.AcceptSchoolRequest) (*schema.AcceptSchoolRequestResult, error)
}

type schoolRequestService struct {
	queries  *dbsqlc.Queries
	accounts AccountService
	logger   logging.Logger
}

func NewSchoolRequestService(queries *dbsqlc.Queries, accounts AccountService, logger logging.Logger) SchoolRequestService {
	return &schoolRequestService{queries: queries, accounts: accounts, logger: logger}
}

func (s *schoolRequestService) ListRequests(ctx context.Context, actor schema.Actor, filter schema.SchoolRequestFilter) ([]*schema.SchoolRequest, error) {
	var region sql.NullInt32
	switch actor.Role {
	case schema.RoleSuperAdmin:
	case schema.RoleRegionalAdmin:
		region = nullID(actor.RegionID)
	default:
		return nil, ErrRequestForbidden
	}
	var status sql.NullString
	if filter.Status != "" {
		status = common.NullString(filter.Status)
	}
	rows, err := s.queries.ListSchoolRequests(ctx, dbsqlc.ListSchoolRequestsParams{RegionID: region, Status: status})
	if err != nil {
		return nil, fmt.Errorf("failed to list school requests: %w", err)
	}
	requests := make([]*schema.SchoolRequest, 0, len(rows))
	for _, row := range rows {
		requests = append(requests, &schema.SchoolRequest{
			ID:                 int64(row.ID),
			Status:             row.Status,
			RegionID:           int64(row.RegionID.Int32),
			RegionName:         row.RegionName,
			DistrictID:         int64(row.DistrictID.Int32),
			DistrictName:       row.DistrictName,
			SchoolName:         row.SchoolName,
			SubmittedAt:        formatNullTime(row.SubmittedAt),
			SubmittedByName:    row.SubmittedByName,
			DecidedAt:          formatNullTime(row.DecidedAt),
			DecidedByName:      row.DecidedByName,
			RegistrationNumber: row.RegistrationNumber.String,
			SchoolID:           int64(row.SchoolID.Int32),
			CreatedAt:          row.CreatedAt.Format(transferTimeFormat),
			UpdatedAt:          row.UpdatedAt.Format(transferTimeFormat),
		})
	}
	return requests, nil
}

func (s *schoolRequestService) GetRequest(ctx context.Context, actor schema.Actor, requestID int64) (*schema.SchoolRequest, error) {
	row, err := s.queries.GetSchoolRequest(ctx, int32(requestID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get school request %d: %w", requestID, err)
	}
	if !canSee(actor, int64(row.RegionID.Int32)) {
		return nil, ErrNotFound
	}
	var form schema.SchoolRequestForm
	if err := json.Unmarshal(row.Form, &form); err != nil {
		return nil, fmt.Errorf("failed to read school request %d form: %w", requestID, err)
	}
	history, err := s.queries.ListSchoolRequestHistory(ctx, int32(requestID))
	if err != nil {
		return nil, fmt.Errorf("failed to get school request %d history: %w", requestID, err)
	}
	request := &schema.SchoolRequest{
		ID:                 int64(row.ID),
		Status:             row.Status,
		RegionID:           int64(row.RegionID.Int32),
		RegionName:         row.RegionName,
		DistrictID:         int64(row.DistrictID.Int32),
		DistrictName:       row.DistrictName,
		SchoolName:         row.SchoolName,
		Form:               &form,
		CreatedByName:      row.CreatedByName,
		SubmittedAt:        formatNullTime(row.SubmittedAt),
		SubmittedByName:    row.SubmittedByName,
		DecidedAt:          formatNullTime(row.DecidedAt),
		DecidedByName:      row.DecidedByName,
		RegistrationNumber: row.RegistrationNumber.String,
		SchoolID:           int64(row.SchoolID.Int32),
		CreatedAt:          row.CreatedAt.Format(transferTimeFormat),
		UpdatedAt:          row.UpdatedAt.Format(transferTimeFormat),
		History:            make([]schema.SchoolRequestEvent, 0, len(history)),
	}
	for _, event := range history {
		request.History = append(request.History, schema.SchoolRequestEvent{
			Action:    event.Action,
			ActorName: event.ActorName,
			ActorRole: event.ActorRole,
			Note:      event.Note,
			At:        event.CreatedAt.Format(transferTimeFormat),
		})
	}
	return request, nil
}

// canSee: the super admin sees every request, a division officer their division's.
func canSee(actor schema.Actor, regionID int64) bool {
	return actor.Role == schema.RoleSuperAdmin || (actor.Role == schema.RoleRegionalAdmin && actor.RegionID == regionID)
}

func (s *schoolRequestService) CreateRequest(ctx context.Context, actor schema.Actor, form *schema.SchoolRequestForm) (*schema.SchoolRequest, error) {
	if actor.Role != schema.RoleRegionalAdmin {
		return nil, ErrRequestForbidden
	}
	params, err := s.formParams(ctx, actor, form)
	if err != nil {
		return nil, err
	}
	id, err := s.queries.CreateSchoolRequest(ctx, dbsqlc.CreateSchoolRequestParams{
		RegionID:    int32(actor.RegionID),
		DistrictID:  params.district,
		SchoolName:  params.name,
		Form:        params.form,
		ActorUserID: int32(actor.UserID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create school request: %w", err)
	}
	return s.GetRequest(ctx, actor, int64(id))
}

func (s *schoolRequestService) UpdateRequest(ctx context.Context, actor schema.Actor, requestID int64, form *schema.SchoolRequestForm) (*schema.SchoolRequest, error) {
	if actor.Role != schema.RoleRegionalAdmin {
		return nil, ErrRequestForbidden
	}
	params, err := s.formParams(ctx, actor, form)
	if err != nil {
		return nil, err
	}
	_, err = s.queries.UpdateSchoolRequest(ctx, dbsqlc.UpdateSchoolRequestParams{
		RequestID:   int32(requestID),
		RegionID:    int32(actor.RegionID),
		DistrictID:  params.district,
		SchoolName:  params.name,
		Form:        params.form,
		ActorUserID: int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, s.notChangeable(ctx, actor, requestID, "edited")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update school request %d: %w", requestID, err)
	}
	return s.GetRequest(ctx, actor, requestID)
}

func (s *schoolRequestService) SubmitRequest(ctx context.Context, actor schema.Actor, requestID int64) (*schema.SchoolRequest, error) {
	if actor.Role != schema.RoleRegionalAdmin {
		return nil, ErrRequestForbidden
	}
	request, err := s.GetRequest(ctx, actor, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != schema.SchoolRequestDraft {
		return nil, newUserError(ErrInUse, "This request has already been submitted.")
	}
	if missing := missingFields(request.Form); len(missing) > 0 {
		return nil, newUserError(ErrRequestIncomplete, "Fill in %s before submitting.", joinList(missing))
	}
	taken, err := s.queries.CountSchoolsWithNameInDistrict(ctx, dbsqlc.CountSchoolsWithNameInDistrictParams{
		Name:       request.SchoolName,
		DistrictID: int32(request.DistrictID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check school name: %w", err)
	}
	if taken > 0 {
		return nil, newUserError(ErrInUse, "%s already has a school called %s.", request.DistrictName, request.SchoolName)
	}
	// The coordinator's account is made with this email when the request is accepted
	emailUsed, err := s.queries.CountUsersWithEmail(ctx, dbsqlc.CountUsersWithEmailParams{Email: request.Form.Coordinator.Email})
	if err != nil {
		return nil, fmt.Errorf("failed to check coordinator email: %w", err)
	}
	if emailUsed > 0 {
		return nil, newUserError(ErrInUse, "%s already has an account. Use a different email for the coordinator.", request.Form.Coordinator.Email)
	}
	_, err = s.queries.SubmitSchoolRequest(ctx, dbsqlc.SubmitSchoolRequestParams{
		RequestID:   int32(requestID),
		RegionID:    int32(actor.RegionID),
		ActorUserID: int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, s.notChangeable(ctx, actor, requestID, "submitted")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to submit school request %d: %w", requestID, err)
	}
	return s.GetRequest(ctx, actor, requestID)
}

func (s *schoolRequestService) DeleteRequest(ctx context.Context, actor schema.Actor, requestID int64) error {
	if actor.Role != schema.RoleRegionalAdmin {
		return ErrRequestForbidden
	}
	_, err := s.queries.DeleteSchoolRequest(ctx, dbsqlc.DeleteSchoolRequestParams{
		RequestID:   int32(requestID),
		RegionID:    int32(actor.RegionID),
		ActorUserID: int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return s.notChangeable(ctx, actor, requestID, "deleted")
	}
	if err != nil {
		return fmt.Errorf("failed to delete school request %d: %w", requestID, err)
	}
	return nil
}

func (s *schoolRequestService) AcceptRequest(ctx context.Context, actor schema.Actor, requestID int64, req *schema.AcceptSchoolRequest) (*schema.AcceptSchoolRequestResult, error) {
	if actor.Role != schema.RoleSuperAdmin {
		return nil, ErrRequestForbidden
	}
	request, err := s.GetRequest(ctx, actor, requestID)
	if err != nil {
		return nil, err
	}
	if request.Status != schema.SchoolRequestSubmitted {
		return nil, s.notDecidable(ctx, actor, requestID)
	}
	number := strings.TrimSpace(req.RegistrationNumber)
	used, err := s.queries.CountSchoolsWithNumber(ctx, number)
	if err != nil {
		return nil, fmt.Errorf("failed to check registration number: %w", err)
	}
	if used > 0 {
		return nil, newUserError(ErrInUse, "Registration number %s is already used by another school.", number)
	}
	taken, err := s.queries.CountSchoolsWithNameInDistrict(ctx, dbsqlc.CountSchoolsWithNameInDistrictParams{
		Name:       request.SchoolName,
		DistrictID: int32(request.DistrictID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check school name: %w", err)
	}
	if taken > 0 {
		return nil, newUserError(ErrInUse, "%s already has a school called %s. Ask the division to rename the school, then accept.", request.DistrictName, request.SchoolName)
	}

	schoolID, err := s.queries.AcceptSchoolRequest(ctx, dbsqlc.AcceptSchoolRequestParams{
		RequestID:          int32(requestID),
		RegistrationNumber: number,
		ActorUserID:        int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, s.notDecidable(ctx, actor, requestID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to accept school request %d: %w", requestID, err)
	}
	result := &schema.AcceptSchoolRequestResult{SchoolID: int64(schoolID)}

	// The coordinator registers the school's learners. The school exists now, so an
	// account problem is reported rather than undoing the registration.
	coordinator := request.Form.Coordinator
	account, err := s.accounts.CreateAccount(ctx, actor, &schema.CreateAccountRequest{
		Name:     coordinator.Name,
		Email:    coordinator.Email,
		Role:     schema.RoleSchoolManager,
		SchoolID: int64(schoolID),
		Phone:    coordinator.Phone,
	})
	if err != nil {
		s.logger.Error("school-requests", "coordinator account not created", "request_id", requestID, "error", err)
		result.AccountError = "The school was registered, but the coordinator's account was not created: " + err.Error() + ". Create it on the Accounts page."
	} else {
		result.Account = account
	}
	return result, nil
}

type formValues struct {
	district sql.NullInt32
	name     string
	form     json.RawMessage
}

// formParams tidies a form and checks its district is in the actor's division.
func (s *schoolRequestService) formParams(ctx context.Context, actor schema.Actor, form *schema.SchoolRequestForm) (*formValues, error) {
	tidyForm(form)
	values := &formValues{name: form.SchoolName}
	if form.DistrictID > 0 {
		regionID, err := s.queries.GetDistrictRegionID(ctx, int32(form.DistrictID))
		if errors.Is(err, sql.ErrNoRows) || (err == nil && int64(regionID) != actor.RegionID) {
			return nil, newUserError(ErrInvalidMove, "Choose a district in your division.")
		}
		if err != nil {
			return nil, fmt.Errorf("failed to look up district %d: %w", form.DistrictID, err)
		}
		values.district = nullID(form.DistrictID)
	}
	for _, number := range []struct {
		value *string
		whose string
	}{{&form.HeadTeacher.Phone, "head teacher's"}, {&form.Coordinator.Phone, "coordinator's"}} {
		if *number.value == "" {
			continue
		}
		phone, err := common.NormalizeMalawiPhone(*number.value)
		if err != nil {
			return nil, newUserError(ErrInvalidMove, "The %s phone number is not valid: %s", number.whose, err.Error())
		}
		*number.value = phone
	}
	encoded, err := json.Marshal(form)
	if err != nil {
		return nil, fmt.Errorf("failed to encode school request form: %w", err)
	}
	values.form = encoded
	return values, nil
}

// tidyForm trims text and drops empty facilitator rows and PTA names.
func tidyForm(form *schema.SchoolRequestForm) {
	trim := func(values ...*string) {
		for _, v := range values {
			*v = strings.TrimSpace(*v)
		}
	}
	trim(&form.SchoolName, &form.Address, &form.VenueName,
		&form.HeadTeacher.Name, &form.HeadTeacher.Phone, &form.HeadTeacher.Email,
		&form.Coordinator.Name, &form.Coordinator.Qualifications, &form.Coordinator.Email, &form.Coordinator.Phone)
	form.Coordinator.Email = strings.ToLower(form.Coordinator.Email)
	facilitators := form.Facilitators[:0]
	for _, f := range form.Facilitators {
		trim(&f.Name, &f.Qualification, &f.SubjectCombination)
		if f.Name != "" || f.Qualification != "" || f.SubjectCombination != "" {
			facilitators = append(facilitators, f)
		}
	}
	if facilitators == nil {
		facilitators = []schema.SchoolRequestFacilitator{}
	}
	form.Facilitators = facilitators

	members := []string{}
	for _, name := range form.PTAMembers {
		if name = strings.TrimSpace(name); name != "" {
			members = append(members, name)
		}
	}
	form.PTAMembers = members
}

// missingFields lists what a form still needs before it can be submitted, in the
// order the fields appear on the paper form.
func missingFields(form *schema.SchoolRequestForm) []string {
	var missing []string
	need := func(ok bool, label string) {
		if !ok {
			missing = append(missing, label)
		}
	}
	need(form.SchoolName != "", "the school name")
	need(form.DistrictID > 0, "the district")
	need(form.Location != "", "the location")
	need(form.Address != "", "the address")
	need(form.HeadTeacher.Name != "", "the head teacher's name")
	need(form.HeadTeacher.Phone != "", "the head teacher's phone number")
	need(form.VenueType != "" && form.VenueName != "", "where the OSS will run")
	need(len(form.Facilitators) > 0, "at least one teacher or facilitator")
	for i, f := range form.Facilitators {
		need(f.Name != "", fmt.Sprintf("the name of facilitator %d", i+1))
	}
	need(form.Coordinator.Name != "", "the coordinator's name")
	need(form.Coordinator.Email != "", "the coordinator's email (for their account)")
	e := form.Enrolment
	need(e.Form1 != nil && e.Form2 != nil && e.Form3 != nil && e.Form4 != nil, "the initial enrolment for every form (0 if none)")
	need(form.DistanceKm != nil, "the distance to the next open secondary school")
	need(len(form.PTAMembers) > 0, "at least one PTA/Board member")
	return missing
}

// notChangeable explains why a division officer's edit, submit or delete did nothing.
func (s *schoolRequestService) notChangeable(ctx context.Context, actor schema.Actor, requestID int64, verb string) error {
	request, err := s.GetRequest(ctx, actor, requestID)
	if err != nil {
		return err
	}
	if request.RegionID != actor.RegionID {
		return ErrNotFound
	}
	return newUserError(ErrInUse, "This request is %s and cannot be %s.", strings.ToLower(request.Status), verb)
}

// notDecidable explains why the super admin's accept did nothing.
func (s *schoolRequestService) notDecidable(ctx context.Context, actor schema.Actor, requestID int64) error {
	request, err := s.GetRequest(ctx, actor, requestID)
	if err != nil {
		return err
	}
	if request.Status == schema.SchoolRequestSubmitted && request.DistrictID == 0 {
		return newUserError(ErrInUse, "This request has no district, so the school cannot be created. Ask the division to fix it.")
	}
	return newUserError(ErrInUse, "This request is %s, so it cannot be accepted.", strings.ToLower(request.Status))
}
