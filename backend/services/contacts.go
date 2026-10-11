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

// ContactService is the contact directory: how to reach the ministry, each division
// office and each school outside NSMS.
//
// Office details (phones, emails, addresses, head teachers) and the ministry and
// regional admins' details are visible to every signed-in user. A school manager's
// own email and numbers are personal, so only the super admin, the regional admin of
// that school's division and the school's other managers see them.
//
// The super admin edits any office; a regional admin edits their own division office
// and its schools; a school manager edits their own school.
type ContactService interface {
	GetDirectory(ctx context.Context, actor schema.Actor) (*schema.Directory, error)
	UpdateRegionOffice(ctx context.Context, actor schema.Actor, regionID int64, req *schema.UpdateRegionOfficeRequest) error
	UpdateSchoolOffice(ctx context.Context, actor schema.Actor, schoolID int64, req *schema.UpdateSchoolOfficeRequest) error
}

var ErrContactForbidden = errors.New("you are not allowed to edit these contact details")

type contactService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewContactService(queries *dbsqlc.Queries, logger logging.Logger) ContactService {
	return &contactService{queries: queries, logger: logger}
}

func canEditRegion(actor schema.Actor, regionID int64) bool {
	return actor.Role == schema.RoleSuperAdmin || (actor.Role == schema.RoleRegionalAdmin && actor.RegionID == regionID)
}

func canEditSchool(actor schema.Actor, schoolID, regionID int64) bool {
	switch actor.Role {
	case schema.RoleSuperAdmin:
		return true
	case schema.RoleRegionalAdmin:
		return actor.RegionID == regionID
	case schema.RoleSchoolManager:
		return actor.SchoolID == schoolID
	}
	return false
}

func (s *contactService) GetDirectory(ctx context.Context, actor schema.Actor) (*schema.Directory, error) {
	regions, err := s.queries.ListDirectoryRegions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list division contacts: %w", err)
	}
	schools, err := s.queries.ListDirectorySchools(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list school contacts: %w", err)
	}
	people, err := s.queries.ListDirectoryPeople(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list people: %w", err)
	}

	directory := &schema.Directory{
		Ministry: []schema.PersonContact{},
		Regions:  make([]*schema.RegionDirectoryEntry, 0, len(regions)),
		Schools:  make([]*schema.SchoolDirectoryEntry, 0, len(schools)),
	}
	managers := map[int64][]dbsqlc.ListDirectoryPeopleRow{}
	for _, person := range people {
		switch person.Role {
		case schema.RoleSuperAdmin:
			directory.Ministry = append(directory.Ministry, schema.PersonContact{
				ID: int64(person.ID), Name: person.Name, Role: person.Role, Email: person.Email,
				Phone: person.Phone.String, WhatsApp: person.Whatsapp.String,
			})
		case schema.RoleSchoolManager:
			managers[int64(person.SchoolID.Int32)] = append(managers[int64(person.SchoolID.Int32)], person)
		}
	}

	for _, row := range regions {
		entry := &schema.RegionDirectoryEntry{
			ID:   int64(row.ID),
			Name: row.Name,
			Office: schema.OfficeContact{
				Phone:           row.OfficePhone.String,
				Email:           row.OfficeEmail.String,
				PostalAddress:   row.PostalAddress.String,
				PhysicalAddress: row.PhysicalAddress.String,
			},
			CanEdit: canEditRegion(actor, int64(row.ID)),
			IsOwn:   actor.Role == schema.RoleRegionalAdmin && actor.RegionID == int64(row.ID),
		}
		if row.AdminID.Valid {
			entry.Admin = &schema.PersonContact{
				ID: int64(row.AdminID.Int32), Name: row.AdminName.String, Role: schema.RoleRegionalAdmin,
				Email: row.AdminEmail, Phone: row.AdminPhone.String, WhatsApp: row.AdminWhatsapp.String,
			}
		}
		directory.Regions = append(directory.Regions, entry)
	}

	for _, row := range schools {
		schoolID, regionID := int64(row.ID), int64(row.RegionID)
		// A manager's personal details are for the ministry, their division and their colleagues
		seesManagerDetails := actor.Role == schema.RoleSuperAdmin ||
			(actor.Role == schema.RoleRegionalAdmin && actor.RegionID == regionID) ||
			(actor.Role == schema.RoleSchoolManager && actor.SchoolID == schoolID)

		entry := &schema.SchoolDirectoryEntry{
			ID:           schoolID,
			Name:         row.Name,
			SchoolNumber: row.SchoolNumber,
			DistrictID:   int64(row.DistrictID),
			DistrictName: row.DistrictName,
			RegionID:     regionID,
			RegionName:   row.RegionName,
			Office: schema.OfficeContact{
				Phone:         row.Phone.String,
				Email:         row.Email.String,
				PostalAddress: row.PostalAddress.String,
			},
			HeadTeacherName:  row.HeadTeacherName.String,
			HeadTeacherPhone: row.HeadTeacherPhone.String,
			Managers:         []schema.PersonContact{},
			CanEdit:          canEditSchool(actor, schoolID, regionID),
			IsOwn:            actor.Role == schema.RoleSchoolManager && actor.SchoolID == schoolID,
		}
		for _, manager := range managers[schoolID] {
			contact := schema.PersonContact{ID: int64(manager.ID), Name: manager.Name, Role: manager.Role}
			if seesManagerDetails {
				contact.Email = manager.Email
				contact.Phone = manager.Phone.String
				contact.WhatsApp = manager.Whatsapp.String
			}
			entry.Managers = append(entry.Managers, contact)
		}
		directory.Schools = append(directory.Schools, entry)
	}
	return directory, nil
}

// optionalPhone normalizes a phone number that may be left empty.
func optionalPhone(value string) (sql.NullString, error) {
	phone, err := common.NormalizeMalawiPhone(value)
	if err != nil {
		return sql.NullString{}, err
	}
	return common.NullString(phone), nil
}

func (s *contactService) UpdateRegionOffice(ctx context.Context, actor schema.Actor, regionID int64, req *schema.UpdateRegionOfficeRequest) error {
	if !canEditRegion(actor, regionID) {
		return ErrContactForbidden
	}
	phone, err := optionalPhone(req.Phone)
	if err != nil {
		return err
	}
	_, err = s.queries.UpdateRegionOffice(ctx, dbsqlc.UpdateRegionOfficeParams{
		RegionID:        int32(regionID),
		OfficePhone:     phone,
		OfficeEmail:     common.NullString(strings.ToLower(strings.TrimSpace(req.Email))),
		PostalAddress:   common.NullString(strings.TrimSpace(req.PostalAddress)),
		PhysicalAddress: common.NullString(strings.TrimSpace(req.PhysicalAddress)),
		ActorUserID:     int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to update division %d office: %w", regionID, err)
	}
	return nil
}

func (s *contactService) UpdateSchoolOffice(ctx context.Context, actor schema.Actor, schoolID int64, req *schema.UpdateSchoolOfficeRequest) error {
	school, err := s.queries.GetSchoolScope(ctx, int32(schoolID))
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to look up school %d: %w", schoolID, err)
	}
	if !canEditSchool(actor, schoolID, int64(school.RegionID)) {
		return ErrContactForbidden
	}
	phone, err := optionalPhone(req.Phone)
	if err != nil {
		return err
	}
	headPhone, err := optionalPhone(req.HeadTeacherPhone)
	if err != nil {
		return err
	}
	_, err = s.queries.UpdateSchoolOffice(ctx, dbsqlc.UpdateSchoolOfficeParams{
		SchoolID:         int32(schoolID),
		Phone:            phone,
		Email:            common.NullString(strings.ToLower(strings.TrimSpace(req.Email))),
		PostalAddress:    common.NullString(strings.TrimSpace(req.PostalAddress)),
		HeadTeacherName:  common.NullString(strings.TrimSpace(req.HeadTeacherName)),
		HeadTeacherPhone: headPhone,
		ActorUserID:      int32(actor.UserID),
	})
	if err != nil {
		return fmt.Errorf("failed to update school %d office: %w", schoolID, err)
	}
	return nil
}
