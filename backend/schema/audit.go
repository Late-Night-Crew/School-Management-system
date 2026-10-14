package schema

// AuditFilter narrows the activity log. Dates are YYYY-MM-DD and inclusive.
type AuditFilter struct {
	ActorUserID int64  `query:"actor_user_id"`
	ActorRole   string `query:"actor_role" validate:"omitempty,oneof=SUPER_ADMIN REGIONAL_ADMIN SCHOOL_MANAGER"`
	EntityType  string `query:"entity_type" validate:"max=50"`
	From        string `query:"from" validate:"omitempty,datetime=2006-01-02"`
	To          string `query:"to" validate:"omitempty,datetime=2006-01-02"`
	Search      string `query:"q" validate:"max=100"`
	// ShowSignIns includes sign-ins and failed sign-ins, which are hidden by default
	ShowSignIns bool `query:"show_sign_ins"`
	Page        int  `query:"page" validate:"omitempty,min=1,max=100000"`
	PageSize    int  `query:"page_size" validate:"omitempty,min=1,max=5000"`
}

// AuditEntry is one thing someone did.
type AuditEntry struct {
	ID          int64  `json:"id"`
	At          string `json:"at"`
	ActorUserID int64  `json:"actor_user_id"`
	ActorName   string `json:"actor_name"`
	ActorRole   string `json:"actor_role"`
	Action      string `json:"action"`
	EntityType  string `json:"entity_type"`
	EntityID    int64  `json:"entity_id"`
	EntityLabel string `json:"entity_label"`
	Note        string `json:"note"`
}

type AuditPage struct {
	Entries  []AuditEntry `json:"entries"`
	Total    int          `json:"total"`
	Page     int          `json:"page"`
	PageSize int          `json:"page_size"`
}

type AuditActor struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	Entries int    `json:"entries"`
}
