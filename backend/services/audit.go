package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"nsms/common"
	"nsms/database/dbsqlc"
	"nsms/schema"
)

// AuditService reads the activity log (audit_logs), which the rest of the app writes.
type AuditService interface {
	List(ctx context.Context, filter *schema.AuditFilter) (*schema.AuditPage, error)
	Actors(ctx context.Context) ([]schema.AuditActor, error)
}

type auditService struct{ queries *dbsqlc.Queries }

func NewAuditService(queries *dbsqlc.Queries) AuditService { return &auditService{queries: queries} }

func auditDate(value string) sql.NullTime {
	t, err := time.Parse(time.DateOnly, value)
	return sql.NullTime{Time: t, Valid: value != "" && err == nil}
}

func (s *auditService) List(ctx context.Context, filter *schema.AuditFilter) (*schema.AuditPage, error) {
	page, size := filter.Page, filter.PageSize
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 50
	}
	actor, role, entity := optionalID(filter.ActorUserID), common.NullString(filter.ActorRole), common.NullString(filter.EntityType)
	from, to, search := auditDate(filter.From), auditDate(filter.To), common.NullString(strings.TrimSpace(filter.Search))
	rows, err := s.queries.ListAuditLogs(ctx, dbsqlc.ListAuditLogsParams{
		ActorUserID: actor, ActorRole: role, EntityType: entity, FromDate: from, ToDate: to, Search: search,
		PageSize: int32(size), PageOffset: int32((page - 1) * size),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to read the activity log: %w", err)
	}
	total, err := s.queries.CountAuditLogs(ctx, dbsqlc.CountAuditLogsParams{
		ActorUserID: actor, ActorRole: role, EntityType: entity, FromDate: from, ToDate: to, Search: search,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to count the activity log: %w", err)
	}
	out := &schema.AuditPage{Entries: make([]schema.AuditEntry, 0, len(rows)), Total: int(total), Page: page, PageSize: size}
	for _, r := range rows {
		out.Entries = append(out.Entries, schema.AuditEntry{
			ID: int64(r.ID), At: r.CreatedAt.Format(transferTimeFormat), ActorUserID: int64(r.ActorUserID),
			ActorName: r.ActorName, ActorRole: r.ActorRole, Action: r.Action, EntityType: r.EntityType,
			EntityID: int64(r.EntityID), EntityLabel: r.EntityLabel, Note: r.Note,
		})
	}
	return out, nil
}

func (s *auditService) Actors(ctx context.Context) ([]schema.AuditActor, error) {
	rows, err := s.queries.ListAuditActors(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list people in the activity log: %w", err)
	}
	out := make([]schema.AuditActor, 0, len(rows))
	for _, r := range rows {
		out = append(out, schema.AuditActor{ID: int64(r.ID), Name: r.Name, Role: r.Role, Entries: int(r.Entries)})
	}
	return out, nil
}
