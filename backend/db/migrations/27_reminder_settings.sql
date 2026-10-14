-- +goose Up
-- When term reminders go out, set by MCDE: days before a term ends for the first
-- reminder, days after it ends for the urgent follow-up, and days after it ends before
-- the division office is told (one summary per division per day).
CREATE TABLE IF NOT EXISTS reminder_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    days_before INT NOT NULL DEFAULT 7 CHECK (days_before BETWEEN 1 AND 60),
    overdue_after INT NOT NULL DEFAULT 7 CHECK (overdue_after BETWEEN 1 AND 60),
    escalate_after INT NOT NULL DEFAULT 14 CHECK (escalate_after BETWEEN 2 AND 90),
    CHECK (escalate_after > overdue_after),
    updated_by INT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO reminder_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS reminder_settings;
