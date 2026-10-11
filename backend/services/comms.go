package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"nsms/database/dbsqlc"
	"nsms/logging"
	"nsms/schema"
)

// CommsService handles internal communication between the ministry, regional offices
// and schools.
//
// Notices are one-way and go to many recipients. Only the super admin and regional
// admins send them; a regional admin only reaches schools in their own region.
//
// Conversations are private two-party threads. Who may start one with whom:
//
//	super admin    -> any regional office or school
//	regional admin -> the ministry, other regional offices, schools in their region
//	school         -> the ministry, its own regional office, any other school
//
// Only the two parties can read a conversation. If either reports it, the super admin
// can read it too. Nothing is edited or deleted once sent; notices can be withdrawn.
type CommsService interface {
	GetSummary(ctx context.Context, actor schema.Actor) (*schema.CommsSummary, error)

	PreviewAudience(ctx context.Context, actor schema.Actor, audienceType string, audienceID int64) (int64, error)
	SendNotice(ctx context.Context, actor schema.Actor, req *schema.CreateNoticeRequest) (*schema.NoticeSent, error)
	RemindPending(ctx context.Context, actor schema.Actor, noticeID int64) (*schema.NoticeSent, error)
	WithdrawNotice(ctx context.Context, actor schema.Actor, noticeID int64, reason string) error
	ListInbox(ctx context.Context, actor schema.Actor) ([]*schema.InboxNotice, error)
	ListSent(ctx context.Context, actor schema.Actor) ([]*schema.SentNotice, error)
	ListRecipients(ctx context.Context, actor schema.Actor, noticeID int64) ([]*schema.NoticeRecipient, error)
	MarkNoticeRead(ctx context.Context, actor schema.Actor, noticeID int64) error
	MarkNoticeDone(ctx context.Context, actor schema.Actor, noticeID int64) error

	ListContacts(ctx context.Context, actor schema.Actor) ([]*schema.ContactParty, error)
	StartConversation(ctx context.Context, actor schema.Actor, req *schema.CreateConversationRequest) (*schema.ConversationDetail, error)
	ListConversations(ctx context.Context, actor schema.Actor) ([]*schema.ConversationSummary, error)
	ListReportedConversations(ctx context.Context, actor schema.Actor) ([]*schema.ReportedConversation, error)
	GetConversation(ctx context.Context, actor schema.Actor, conversationID int64) (*schema.ConversationDetail, error)
	SendMessage(ctx context.Context, actor schema.Actor, conversationID int64, body string) (*schema.ConversationDetail, error)
	ReportConversation(ctx context.Context, actor schema.Actor, conversationID int64, reason string) error
}

var (
	ErrCommsForbidden      = errors.New("you are not allowed to contact this recipient")
	ErrCommsRateLimited    = errors.New("you are sending too quickly; please wait a little and try again")
	ErrNoRecipients        = errors.New("this audience has no recipients")
	ErrNothingPending      = errors.New("every recipient has already acted on this notice")
	ErrNoticeWithdrawn     = errors.New("this notice has been withdrawn")
	ErrAlreadyReported     = errors.New("this conversation has already been reported")
	ErrDueDateInPast       = errors.New("the due date cannot be in the past")
	ErrSelfConversation    = errors.New("you cannot start a conversation with yourself")
	ErrEmptyCommsText      = errors.New("the message cannot be empty")
	ErrNoticeNotForSending = errors.New("only the super admin and regional admins can send notices")
)

// Rate limits per user, to contain a misused or compromised account.
const (
	maxNoticesPerHour       = 20
	maxConversationsPerHour = 10
	maxMessagesPerMinute    = 30
)

type commsService struct {
	queries *dbsqlc.Queries
	logger  logging.Logger
}

func NewCommsService(queries *dbsqlc.Queries, logger logging.Logger) CommsService {
	return &commsService{queries: queries, logger: logger}
}

func (s *commsService) GetSummary(ctx context.Context, actor schema.Actor) (*schema.CommsSummary, error) {
	party := actor.Party()
	row, err := s.queries.GetCommsSummary(ctx, dbsqlc.GetCommsSummaryParams{PartyType: party.Type, PartyID: int32(party.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to get communications summary: %w", err)
	}
	return &schema.CommsSummary{
		UnreadNotices:       row.UnreadNotices,
		OpenTasks:           row.OpenTasks,
		UnreadConversations: row.UnreadConversations,
	}, nil
}

// checkAudience enforces who may send to an audience: the super admin to anyone,
// a regional admin only to schools in their own region.
func (s *commsService) checkAudience(ctx context.Context, actor schema.Actor, audienceType string, audienceID int64) error {
	switch actor.Role {
	case schema.RoleSuperAdmin:
		return nil
	case schema.RoleRegionalAdmin:
	default:
		return ErrNoticeNotForSending
	}

	var regionID int32
	var err error
	switch audienceType {
	case schema.AudienceSchoolsInRegion:
		regionID = int32(audienceID)
	case schema.AudienceSchoolsInDistrict:
		regionID, err = s.queries.GetDistrictRegionID(ctx, int32(audienceID))
	case schema.AudienceSchool:
		regionID, err = s.queries.GetSchoolRegionID(ctx, int32(audienceID))
	default:
		return ErrCommsForbidden
	}
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNoRecipients
	}
	if err != nil {
		return fmt.Errorf("failed to check notice audience: %w", err)
	}
	if int64(regionID) != actor.RegionID {
		return ErrCommsForbidden
	}
	return nil
}

func (s *commsService) PreviewAudience(ctx context.Context, actor schema.Actor, audienceType string, audienceID int64) (int64, error) {
	if err := s.checkAudience(ctx, actor, audienceType, audienceID); err != nil {
		return 0, err
	}
	count, err := s.queries.CountNoticeAudience(ctx, dbsqlc.CountNoticeAudienceParams{
		AudienceType: audienceType,
		AudienceID:   nullID(audienceID),
	})
	if err != nil {
		return 0, fmt.Errorf("failed to count notice audience: %w", err)
	}
	return int64(count), nil
}

func (s *commsService) SendNotice(ctx context.Context, actor schema.Actor, req *schema.CreateNoticeRequest) (*schema.NoticeSent, error) {
	title, body := strings.TrimSpace(req.Title), strings.TrimSpace(req.Body)
	if title == "" || body == "" {
		return nil, ErrEmptyCommsText
	}
	dueDate := nullDate(req.DueDate)
	if dueDate.Valid && dueDate.Time.Before(today()) {
		return nil, ErrDueDateInPast
	}
	priority := req.Priority
	if priority == "" {
		priority = schema.NoticePriorityNormal
	}

	count, err := s.PreviewAudience(ctx, actor, req.AudienceType, req.AudienceID)
	if err != nil {
		return nil, err
	}
	if count == 0 {
		return nil, ErrNoRecipients
	}
	recent, err := s.queries.CountRecentNoticesByUser(ctx, sql.NullInt32{Int32: int32(actor.UserID), Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to check notice rate: %w", err)
	}
	if recent >= maxNoticesPerHour {
		return nil, ErrCommsRateLimited
	}

	party := actor.Party()
	row, err := s.queries.CreateNotice(ctx, dbsqlc.CreateNoticeParams{
		SenderPartyType: party.Type,
		SenderPartyID:   int32(party.ID),
		Title:           title,
		Body:            body,
		Priority:        priority,
		DueDate:         dueDate,
		AudienceType:    req.AudienceType,
		AudienceID:      nullID(req.AudienceID),
		SenderUserID:    int32(actor.UserID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to send notice: %w", err)
	}
	return &schema.NoticeSent{ID: int64(row.ID), RecipientCount: int64(row.RecipientCount)}, nil
}

// getOwnNotice returns the notice only if the actor's party sent it.
func (s *commsService) getOwnNotice(ctx context.Context, actor schema.Actor, noticeID int64) (dbsqlc.GetNoticeForSenderRow, error) {
	party := actor.Party()
	row, err := s.queries.GetNoticeForSender(ctx, dbsqlc.GetNoticeForSenderParams{
		NoticeID:        int32(noticeID),
		SenderPartyType: party.Type,
		SenderPartyID:   int32(party.ID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return row, ErrNotFound
	}
	if err != nil {
		return row, fmt.Errorf("failed to get notice %d: %w", noticeID, err)
	}
	return row, nil
}

func (s *commsService) RemindPending(ctx context.Context, actor schema.Actor, noticeID int64) (*schema.NoticeSent, error) {
	notice, err := s.getOwnNotice(ctx, actor, noticeID)
	if err != nil {
		return nil, err
	}
	if notice.WithdrawnAt.Valid {
		return nil, ErrNoticeWithdrawn
	}
	recent, err := s.queries.CountRecentNoticesByUser(ctx, sql.NullInt32{Int32: int32(actor.UserID), Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to check notice rate: %w", err)
	}
	if recent >= maxNoticesPerHour {
		return nil, ErrCommsRateLimited
	}

	row, err := s.queries.CreateReminderNotice(ctx, dbsqlc.CreateReminderNoticeParams{
		NoticeID:     int32(noticeID),
		SenderUserID: int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNothingPending
	}
	if err != nil {
		return nil, fmt.Errorf("failed to send reminder for notice %d: %w", noticeID, err)
	}
	return &schema.NoticeSent{ID: int64(row.ID), RecipientCount: int64(row.RecipientCount)}, nil
}

func (s *commsService) WithdrawNotice(ctx context.Context, actor schema.Actor, noticeID int64, reason string) error {
	notice, err := s.getOwnNotice(ctx, actor, noticeID)
	if err != nil {
		return err
	}
	if notice.WithdrawnAt.Valid {
		return ErrNoticeWithdrawn
	}
	party := actor.Party()
	_, err = s.queries.WithdrawNotice(ctx, dbsqlc.WithdrawNoticeParams{
		Reason:          strings.TrimSpace(reason),
		NoticeID:        int32(noticeID),
		SenderPartyType: party.Type,
		SenderPartyID:   int32(party.ID),
		UserID:          int32(actor.UserID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNoticeWithdrawn
	}
	if err != nil {
		return fmt.Errorf("failed to withdraw notice %d: %w", noticeID, err)
	}
	return nil
}

func (s *commsService) ListInbox(ctx context.Context, actor schema.Actor) ([]*schema.InboxNotice, error) {
	party := actor.Party()
	rows, err := s.queries.ListNoticeInbox(ctx, dbsqlc.ListNoticeInboxParams{PartyType: party.Type, PartyID: int32(party.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to list notices: %w", err)
	}
	notices := make([]*schema.InboxNotice, 0, len(rows))
	for _, row := range rows {
		notices = append(notices, &schema.InboxNotice{
			ID:              int64(row.ID),
			Kind:            row.Kind,
			Title:           row.Title,
			Body:            row.Body,
			Priority:        row.Priority,
			DueDate:         formatDay(row.DueDate),
			SenderName:      row.SenderName.String,
			SenderLabel:     row.SenderLabel,
			CreatedAt:       row.CreatedAt.Format(transferTimeFormat),
			WithdrawnAt:     formatNullTime(row.WithdrawnAt),
			WithdrawnReason: row.WithdrawnReason.String,
			ReadAt:          formatNullTime(row.ReadAt),
			DoneAt:          formatNullTime(row.DoneAt),
			DoneByName:      row.DoneByName.String,
		})
	}
	return notices, nil
}

func (s *commsService) ListSent(ctx context.Context, actor schema.Actor) ([]*schema.SentNotice, error) {
	party := actor.Party()
	rows, err := s.queries.ListSentNotices(ctx, dbsqlc.ListSentNoticesParams{SenderPartyType: party.Type, SenderPartyID: int32(party.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to list sent notices: %w", err)
	}
	notices := make([]*schema.SentNotice, 0, len(rows))
	for _, row := range rows {
		notices = append(notices, &schema.SentNotice{
			ID:              int64(row.ID),
			Title:           row.Title,
			Body:            row.Body,
			Priority:        row.Priority,
			DueDate:         formatDay(row.DueDate),
			AudienceType:    row.AudienceType,
			AudienceLabel:   row.AudienceLabel,
			SenderName:      row.SenderName.String,
			CreatedAt:       row.CreatedAt.Format(transferTimeFormat),
			WithdrawnAt:     formatNullTime(row.WithdrawnAt),
			WithdrawnReason: row.WithdrawnReason.String,
			ReminderOf:      int64(row.ReminderOf.Int32),
			RecipientCount:  row.RecipientCount,
			ReadCount:       row.ReadCount,
			DoneCount:       row.DoneCount,
		})
	}
	return notices, nil
}

func (s *commsService) ListRecipients(ctx context.Context, actor schema.Actor, noticeID int64) ([]*schema.NoticeRecipient, error) {
	if _, err := s.getOwnNotice(ctx, actor, noticeID); err != nil {
		return nil, err
	}
	rows, err := s.queries.ListNoticeRecipients(ctx, int32(noticeID))
	if err != nil {
		return nil, fmt.Errorf("failed to list recipients of notice %d: %w", noticeID, err)
	}
	recipients := make([]*schema.NoticeRecipient, 0, len(rows))
	for _, row := range rows {
		recipients = append(recipients, &schema.NoticeRecipient{
			Party:        schema.Party{Type: row.PartyType, ID: int64(row.PartyID), Label: row.Label},
			DistrictName: row.DistrictName,
			ReadAt:       formatNullTime(row.ReadAt),
			DoneAt:       formatNullTime(row.DoneAt),
			DoneByName:   row.DoneByName.String,
		})
	}
	return recipients, nil
}

func (s *commsService) MarkNoticeRead(ctx context.Context, actor schema.Actor, noticeID int64) error {
	party := actor.Party()
	_, err := s.queries.MarkNoticeRead(ctx, dbsqlc.MarkNoticeReadParams{
		UserID:    int32(actor.UserID),
		NoticeID:  int32(noticeID),
		PartyType: party.Type,
		PartyID:   int32(party.ID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to mark notice %d read: %w", noticeID, err)
	}
	return nil
}

func (s *commsService) MarkNoticeDone(ctx context.Context, actor schema.Actor, noticeID int64) error {
	party := actor.Party()
	_, err := s.queries.MarkNoticeDone(ctx, dbsqlc.MarkNoticeDoneParams{
		UserID:    int32(actor.UserID),
		NoticeID:  int32(noticeID),
		PartyType: party.Type,
		PartyID:   int32(party.ID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		// Either not a recipient, or the notice was withdrawn
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to mark notice %d done: %w", noticeID, err)
	}
	return nil
}

const ministryLabel = "Ministry Headquarters"

func regionLabel(name string) string { return name + " Regional Office" }

// ListContacts returns everyone the actor may start a conversation with. It is also
// the rule StartConversation checks against.
func (s *commsService) ListContacts(ctx context.Context, actor schema.Actor) ([]*schema.ContactParty, error) {
	regions, err := s.queries.ListContactRegions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list regions: %w", err)
	}
	schools, err := s.queries.ListContactSchools(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list schools: %w", err)
	}

	me := actor.Party()
	var ownRegionID int64 // region of the actor's school, for school managers
	if me.Type == schema.PartySchool {
		for _, school := range schools {
			if int64(school.ID) == me.ID {
				ownRegionID = int64(school.RegionID)
			}
		}
	}

	contacts := []*schema.ContactParty{}
	if me.Type != schema.PartySuperAdmin {
		contacts = append(contacts, &schema.ContactParty{
			Party: schema.Party{Type: schema.PartySuperAdmin, Label: ministryLabel},
			Group: "Ministry",
		})
	}
	for _, region := range regions {
		allowed := me.Type == schema.PartySuperAdmin ||
			(me.Type == schema.PartyRegion && int64(region.ID) != me.ID) ||
			(me.Type == schema.PartySchool && int64(region.ID) == ownRegionID)
		if allowed {
			contacts = append(contacts, &schema.ContactParty{
				Party: schema.Party{Type: schema.PartyRegion, ID: int64(region.ID), Label: regionLabel(region.Name)},
				Group: "Regional offices",
			})
		}
	}
	for _, school := range schools {
		allowed := me.Type == schema.PartySuperAdmin ||
			(me.Type == schema.PartyRegion && int64(school.RegionID) == me.ID) ||
			(me.Type == schema.PartySchool && int64(school.ID) != me.ID)
		if allowed {
			contacts = append(contacts, &schema.ContactParty{
				Party: schema.Party{Type: schema.PartySchool, ID: int64(school.ID), Label: school.Name + " (" + school.DistrictName + ")"},
				Group: "Schools: " + school.RegionName + " region",
			})
		}
	}
	return contacts, nil
}

func (s *commsService) StartConversation(ctx context.Context, actor schema.Actor, req *schema.CreateConversationRequest) (*schema.ConversationDetail, error) {
	subject, body := strings.TrimSpace(req.Subject), strings.TrimSpace(req.Body)
	if subject == "" || body == "" {
		return nil, ErrEmptyCommsText
	}
	me := actor.Party()
	to := schema.Party{Type: req.ToType, ID: req.ToID}
	if to.Type == schema.PartySuperAdmin {
		to.ID = 0
	}
	if me.Same(to) {
		return nil, ErrSelfConversation
	}

	contacts, err := s.ListContacts(ctx, actor)
	if err != nil {
		return nil, err
	}
	allowed := false
	for _, contact := range contacts {
		if contact.Same(to) {
			allowed = true
			break
		}
	}
	if !allowed {
		return nil, ErrCommsForbidden
	}

	recent, err := s.queries.CountRecentConversationsByUser(ctx, sql.NullInt32{Int32: int32(actor.UserID), Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to check conversation rate: %w", err)
	}
	if recent >= maxConversationsPerHour {
		return nil, ErrCommsRateLimited
	}

	conversationID, err := s.queries.CreateConversation(ctx, dbsqlc.CreateConversationParams{
		Subject:       subject,
		SenderUserID:  int32(actor.UserID),
		FromPartyType: me.Type,
		FromPartyID:   int32(me.ID),
		ToPartyType:   to.Type,
		ToPartyID:     int32(to.ID),
		Body:          body,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to start conversation: %w", err)
	}
	return s.GetConversation(ctx, actor, int64(conversationID))
}

func (s *commsService) ListConversations(ctx context.Context, actor schema.Actor) ([]*schema.ConversationSummary, error) {
	me := actor.Party()
	rows, err := s.queries.ListConversationsForParty(ctx, dbsqlc.ListConversationsForPartyParams{PartyType: me.Type, PartyID: int32(me.ID)})
	if err != nil {
		return nil, fmt.Errorf("failed to list conversations: %w", err)
	}
	conversations := make([]*schema.ConversationSummary, 0, len(rows))
	for _, row := range rows {
		conversations = append(conversations, &schema.ConversationSummary{
			ID:             int64(row.ID),
			Subject:        row.Subject,
			LastMessageAt:  row.LastMessageAt.Format(transferTimeFormat),
			Reported:       row.ReportedAt.Valid,
			With:           schema.Party{Type: row.OtherPartyType, ID: int64(row.OtherPartyID), Label: row.OtherLabel},
			LastBody:       preview(row.LastBody.String, 140),
			LastSenderName: row.LastSenderName.String,
			LastFromMe:     row.LastFromMe,
			Unread:         row.Unread,
		})
	}
	return conversations, nil
}

func (s *commsService) ListReportedConversations(ctx context.Context, actor schema.Actor) ([]*schema.ReportedConversation, error) {
	if actor.Role != schema.RoleSuperAdmin {
		return nil, ErrCommsForbidden
	}
	rows, err := s.queries.ListReportedConversations(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list reported conversations: %w", err)
	}
	ids := make([]int32, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	participants, err := s.participantsByConversation(ctx, ids)
	if err != nil {
		return nil, err
	}

	reported := make([]*schema.ReportedConversation, 0, len(rows))
	for _, row := range rows {
		reported = append(reported, &schema.ReportedConversation{
			ID:             int64(row.ID),
			Subject:        row.Subject,
			LastMessageAt:  row.LastMessageAt.Format(transferTimeFormat),
			ReportedAt:     formatNullTime(row.ReportedAt),
			ReportedByName: row.ReportedByName.String,
			ReportReason:   row.ReportReason.String,
			Participants:   participants[row.ID],
		})
	}
	return reported, nil
}

func (s *commsService) participantsByConversation(ctx context.Context, ids []int32) (map[int32][]schema.Party, error) {
	rows, err := s.queries.ListConversationParticipants(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("failed to list conversation participants: %w", err)
	}
	byConversation := make(map[int32][]schema.Party, len(ids))
	for _, row := range rows {
		byConversation[row.ConversationID] = append(byConversation[row.ConversationID],
			schema.Party{Type: row.PartyType, ID: int64(row.PartyID), Label: row.Label})
	}
	return byConversation, nil
}

// loadConversation returns the thread if the actor may read it, and whether they are
// a participant (the super admin may read a reported thread without being one).
func (s *commsService) loadConversation(ctx context.Context, actor schema.Actor, conversationID int64) (*schema.ConversationDetail, bool, error) {
	conversation, err := s.queries.GetConversation(ctx, int32(conversationID))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, false, ErrNotFound
	}
	if err != nil {
		return nil, false, fmt.Errorf("failed to get conversation %d: %w", conversationID, err)
	}
	participants, err := s.participantsByConversation(ctx, []int32{int32(conversationID)})
	if err != nil {
		return nil, false, err
	}

	me := actor.Party()
	isParticipant := false
	for _, party := range participants[int32(conversationID)] {
		if party.Same(me) {
			isParticipant = true
		}
	}
	canReview := actor.Role == schema.RoleSuperAdmin && conversation.ReportedAt.Valid
	if !isParticipant && !canReview {
		// Do not reveal that a private conversation exists
		return nil, false, ErrNotFound
	}

	rows, err := s.queries.ListMessages(ctx, int32(conversationID))
	if err != nil {
		return nil, false, fmt.Errorf("failed to list messages of conversation %d: %w", conversationID, err)
	}
	labels := map[schema.Party]string{}
	for _, party := range participants[int32(conversationID)] {
		labels[schema.Party{Type: party.Type, ID: party.ID}] = party.Label
	}
	messages := make([]schema.Message, 0, len(rows))
	for _, row := range rows {
		from := schema.Party{Type: row.SenderPartyType, ID: int64(row.SenderPartyID)}
		messages = append(messages, schema.Message{
			ID:         int64(row.ID),
			SenderName: row.SenderName.String,
			SenderRole: row.SenderRole.String,
			From:       schema.Party{Type: from.Type, ID: from.ID, Label: labels[from]},
			FromMe:     isParticipant && from.Same(me),
			Body:       row.Body,
			CreatedAt:  row.CreatedAt.Format(transferTimeFormat),
		})
	}

	return &schema.ConversationDetail{
		ID:             int64(conversation.ID),
		Subject:        conversation.Subject,
		CreatedAt:      conversation.CreatedAt.Format(transferTimeFormat),
		ReportedAt:     formatNullTime(conversation.ReportedAt),
		ReportedByName: conversation.ReportedByName.String,
		ReportReason:   conversation.ReportReason.String,
		Participants:   participants[int32(conversationID)],
		Messages:       messages,
		ReadOnly:       !isParticipant,
	}, isParticipant, nil
}

// GetConversation returns the thread and, for a participant, marks it read.
func (s *commsService) GetConversation(ctx context.Context, actor schema.Actor, conversationID int64) (*schema.ConversationDetail, error) {
	detail, isParticipant, err := s.loadConversation(ctx, actor, conversationID)
	if err != nil {
		return nil, err
	}
	if isParticipant {
		me := actor.Party()
		err := s.queries.MarkConversationRead(ctx, dbsqlc.MarkConversationReadParams{
			ConversationID: int32(conversationID),
			PartyType:      me.Type,
			PartyID:        int32(me.ID),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to mark conversation %d read: %w", conversationID, err)
		}
	}
	return detail, nil
}

func (s *commsService) SendMessage(ctx context.Context, actor schema.Actor, conversationID int64, body string) (*schema.ConversationDetail, error) {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil, ErrEmptyCommsText
	}
	_, isParticipant, err := s.loadConversation(ctx, actor, conversationID)
	if err != nil {
		return nil, err
	}
	if !isParticipant {
		return nil, ErrCommsForbidden
	}
	recent, err := s.queries.CountRecentMessagesByUser(ctx, sql.NullInt32{Int32: int32(actor.UserID), Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to check message rate: %w", err)
	}
	if recent >= maxMessagesPerMinute {
		return nil, ErrCommsRateLimited
	}

	me := actor.Party()
	_, err = s.queries.CreateMessage(ctx, dbsqlc.CreateMessageParams{
		ConversationID: int32(conversationID),
		PartyType:      me.Type,
		PartyID:        int32(me.ID),
		Body:           body,
		SenderUserID:   int32(actor.UserID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to send message in conversation %d: %w", conversationID, err)
	}
	return s.GetConversation(ctx, actor, conversationID)
}

func (s *commsService) ReportConversation(ctx context.Context, actor schema.Actor, conversationID int64, reason string) error {
	_, isParticipant, err := s.loadConversation(ctx, actor, conversationID)
	if err != nil {
		return err
	}
	if !isParticipant {
		return ErrCommsForbidden
	}
	_, err = s.queries.ReportConversation(ctx, dbsqlc.ReportConversationParams{
		UserID:         int32(actor.UserID),
		Reason:         strings.TrimSpace(reason),
		ConversationID: int32(conversationID),
	})
	if errors.Is(err, sql.ErrNoRows) {
		return ErrAlreadyReported
	}
	if err != nil {
		return fmt.Errorf("failed to report conversation %d: %w", conversationID, err)
	}
	return nil
}

func today() time.Time {
	now := time.Now()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}

// formatDay formats a DATE column as "YYYY-MM-DD", or "" when NULL.
func formatDay(t sql.NullTime) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format(time.DateOnly)
}

// preview shortens text to at most limit characters for list views.
func preview(text string, limit int) string {
	runes := []rune(strings.Join(strings.Fields(text), " "))
	if len(runes) <= limit {
		return string(runes)
	}
	return string(runes[:limit-1]) + "…"
}
