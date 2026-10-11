package schema

// Parties are who sends and receives notices and messages: the ministry (the super
// admin, ID 0), a regional office (region ID) or a school (school ID).
// SYSTEM is the sender of automatic notices.
const (
	PartySuperAdmin = "SUPER_ADMIN"
	PartyRegion     = "REGION"
	PartySchool     = "SCHOOL"
	PartySystem     = "SYSTEM"
)

// Notice audiences. AudienceID is the region, district or school the audience names.
const (
	AudienceRegionalAdmins    = "REGIONAL_ADMINS"
	AudienceRegionalAdmin     = "REGIONAL_ADMIN"
	AudienceSchoolsAll        = "SCHOOLS_ALL"
	AudienceSchoolsInRegion   = "SCHOOLS_IN_REGION"
	AudienceSchoolsInDistrict = "SCHOOLS_IN_DISTRICT"
	AudienceSchool            = "SCHOOL"
)

const (
	NoticePriorityNormal = "Normal"
	NoticePriorityUrgent = "Urgent"
)

// Actor is the signed-in user acting on communications, taken from their token.
type Actor struct {
	UserID   int64
	Role     string
	RegionID int64
	SchoolID int64
}

// Party returns who the actor speaks for: the ministry, their regional office or their school.
func (a Actor) Party() Party {
	switch a.Role {
	case RoleSuperAdmin:
		return Party{Type: PartySuperAdmin}
	case RoleRegionalAdmin:
		return Party{Type: PartyRegion, ID: a.RegionID}
	default:
		return Party{Type: PartySchool, ID: a.SchoolID}
	}
}

type Party struct {
	Type  string `json:"type"`
	ID    int64  `json:"id"`
	Label string `json:"label,omitempty"`
}

// Same reports whether both name the same party, ignoring labels.
func (p Party) Same(other Party) bool {
	return p.Type == other.Type && p.ID == other.ID
}

// ContactParty is someone the actor may start a conversation with. Group is a heading
// for pickers, e.g. "Regional offices" or "Schools: Central region".
type ContactParty struct {
	Party
	Group string `json:"group"`
}

type CommsSummary struct {
	UnreadNotices       int64 `json:"unread_notices"`
	OpenTasks           int64 `json:"open_tasks"`
	UnreadConversations int64 `json:"unread_conversations"`
}

type CreateNoticeRequest struct {
	Title        string `json:"title" validate:"required,max=200"`
	Body         string `json:"body" validate:"required,max=5000"`
	Priority     string `json:"priority" validate:"omitempty,oneof=Normal Urgent"`
	DueDate      string `json:"due_date" validate:"omitempty,datetime=2006-01-02"`
	AudienceType string `json:"audience_type" validate:"required,oneof=REGIONAL_ADMINS REGIONAL_ADMIN SCHOOLS_ALL SCHOOLS_IN_REGION SCHOOLS_IN_DISTRICT SCHOOL"`
	AudienceID   int64  `json:"audience_id"`
}

// AudienceQuery previews how many recipients an audience reaches before sending.
type AudienceQuery struct {
	AudienceType string `query:"audience_type" validate:"required,oneof=REGIONAL_ADMINS REGIONAL_ADMIN SCHOOLS_ALL SCHOOLS_IN_REGION SCHOOLS_IN_DISTRICT SCHOOL"`
	AudienceID   int64  `query:"audience_id"`
}

type AudiencePreview struct {
	RecipientCount int64 `json:"recipient_count"`
}

type NoticeSent struct {
	ID             int64 `json:"id"`
	RecipientCount int64 `json:"recipient_count"`
}

type WithdrawNoticeRequest struct {
	Reason string `json:"reason" validate:"required,max=500"`
}

// InboxNotice is a notice as its recipient sees it, with the recipient's read and done state.
type InboxNotice struct {
	ID              int64  `json:"id"`
	Kind            string `json:"kind"`
	Title           string `json:"title"`
	Body            string `json:"body"`
	Priority        string `json:"priority"`
	DueDate         string `json:"due_date,omitempty"`
	SenderName      string `json:"sender_name,omitempty"`
	SenderLabel     string `json:"sender_label"`
	CreatedAt       string `json:"created_at"`
	WithdrawnAt     string `json:"withdrawn_at,omitempty"`
	WithdrawnReason string `json:"withdrawn_reason,omitempty"`
	ReadAt          string `json:"read_at,omitempty"`
	DoneAt          string `json:"done_at,omitempty"`
	DoneByName      string `json:"done_by_name,omitempty"`
}

// SentNotice is a notice as its sender sees it, with progress across its recipients.
type SentNotice struct {
	ID              int64  `json:"id"`
	Title           string `json:"title"`
	Body            string `json:"body"`
	Priority        string `json:"priority"`
	DueDate         string `json:"due_date,omitempty"`
	AudienceType    string `json:"audience_type"`
	AudienceLabel   string `json:"audience_label"`
	SenderName      string `json:"sender_name,omitempty"`
	CreatedAt       string `json:"created_at"`
	WithdrawnAt     string `json:"withdrawn_at,omitempty"`
	WithdrawnReason string `json:"withdrawn_reason,omitempty"`
	ReminderOf      int64  `json:"reminder_of,omitempty"`
	RecipientCount  int64  `json:"recipient_count"`
	ReadCount       int64  `json:"read_count"`
	DoneCount       int64  `json:"done_count"`
}

type NoticeRecipient struct {
	Party
	DistrictName string `json:"district_name,omitempty"`
	ReadAt       string `json:"read_at,omitempty"`
	DoneAt       string `json:"done_at,omitempty"`
	DoneByName   string `json:"done_by_name,omitempty"`
}

type CreateConversationRequest struct {
	ToType  string `json:"to_type" validate:"required,oneof=SUPER_ADMIN REGION SCHOOL"`
	ToID    int64  `json:"to_id"`
	Subject string `json:"subject" validate:"required,max=200"`
	Body    string `json:"body" validate:"required,max=5000"`
}

type SendMessageRequest struct {
	Body string `json:"body" validate:"required,max=5000"`
}

type ReportConversationRequest struct {
	Reason string `json:"reason" validate:"required,max=500"`
}

type ConversationSummary struct {
	ID             int64  `json:"id"`
	Subject        string `json:"subject"`
	LastMessageAt  string `json:"last_message_at"`
	Reported       bool   `json:"reported"`
	With           Party  `json:"with"`
	LastBody       string `json:"last_body,omitempty"`
	LastSenderName string `json:"last_sender_name,omitempty"`
	LastFromMe     bool   `json:"last_from_me"`
	Unread         bool   `json:"unread"`
}

type ReportedConversation struct {
	ID             int64   `json:"id"`
	Subject        string  `json:"subject"`
	LastMessageAt  string  `json:"last_message_at"`
	ReportedAt     string  `json:"reported_at"`
	ReportedByName string  `json:"reported_by_name,omitempty"`
	ReportReason   string  `json:"report_reason,omitempty"`
	Participants   []Party `json:"participants"`
}

type Message struct {
	ID         int64  `json:"id"`
	SenderName string `json:"sender_name,omitempty"`
	SenderRole string `json:"sender_role,omitempty"`
	From       Party  `json:"from"`
	FromMe     bool   `json:"from_me"`
	Body       string `json:"body"`
	CreatedAt  string `json:"created_at"`
}

// ConversationDetail is a whole thread. ReadOnly is true when the super admin is
// reviewing a reported conversation they are not part of.
type ConversationDetail struct {
	ID             int64     `json:"id"`
	Subject        string    `json:"subject"`
	CreatedAt      string    `json:"created_at"`
	ReportedAt     string    `json:"reported_at,omitempty"`
	ReportedByName string    `json:"reported_by_name,omitempty"`
	ReportReason   string    `json:"report_reason,omitempty"`
	Participants   []Party   `json:"participants"`
	Messages       []Message `json:"messages"`
	ReadOnly       bool      `json:"read_only"`
}
