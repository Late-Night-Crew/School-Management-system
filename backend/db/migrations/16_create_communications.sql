-- +goose Up
-- Internal communication between the ministry, regional offices and schools.
--
-- Senders and recipients are parties rather than users, so a school's inbox belongs to
-- the school whoever its manager is:
--   party_type 'SUPER_ADMIN' (party_id 0), 'REGION' (regions.id) or 'SCHOOL' (schools.id).
-- System notices (automatic transfer updates) have sender_party_type 'SYSTEM'.
-- Sender names and roles are copied in so records read as they were when sent.

-- Notices: one-way messages from the super admin or a regional admin to many recipients.
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(20) NOT NULL DEFAULT 'NOTICE' CHECK (kind IN ('NOTICE', 'SYSTEM')),
    sender_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(150),
    sender_role VARCHAR(50),
    sender_party_type VARCHAR(20) NOT NULL,
    sender_party_id INT NOT NULL DEFAULT 0,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent')),
    due_date DATE,
    audience_type VARCHAR(30) NOT NULL,
    audience_id INT,
    reminder_of INT REFERENCES notices(id) ON DELETE SET NULL,
    withdrawn_at TIMESTAMP,
    withdrawn_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notices_sender ON notices(sender_party_type, sender_party_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notices_sender_user ON notices(sender_user_id, created_at);

-- The recipients are fixed when the notice is sent, so read and done progress is
-- measured against the schools or offices that actually received it.
CREATE TABLE IF NOT EXISTS notice_recipients (
    id SERIAL PRIMARY KEY,
    notice_id INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('REGION', 'SCHOOL')),
    party_id INT NOT NULL,
    read_at TIMESTAMP,
    read_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    done_at TIMESTAMP,
    done_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (notice_id, party_type, party_id)
);

CREATE INDEX IF NOT EXISTS idx_notice_recipients_party ON notice_recipients(party_type, party_id);

-- Conversations: private two-party threads. Only the two parties can read one, unless
-- one of them reports it, which lets the super admin read it.
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(200) NOT NULL,
    created_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reported_at TIMESTAMP,
    reported_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    reported_by_name VARCHAR(150),
    report_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_creator ON conversations(created_by_user_id, created_at);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('SUPER_ADMIN', 'REGION', 'SCHOOL')),
    party_id INT NOT NULL,
    last_read_at TIMESTAMP,
    PRIMARY KEY (conversation_id, party_type, party_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_party ON conversation_participants(party_type, party_id);

-- Messages are never edited or deleted.
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(150),
    sender_role VARCHAR(50),
    sender_party_type VARCHAR(20) NOT NULL,
    sender_party_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_user ON messages(sender_user_id, created_at);

-- +goose Down
DROP TABLE IF EXISTS messages;

DROP TABLE IF EXISTS conversation_participants;

DROP TABLE IF EXISTS conversations;

DROP TABLE IF EXISTS notice_recipients;

DROP TABLE IF EXISTS notices;
