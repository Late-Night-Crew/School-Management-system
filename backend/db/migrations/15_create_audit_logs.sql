-- +goose Up
-- Append-only record of who did what. Rows are never updated or deleted by the app.
-- entity_id has no foreign key so the history survives when the entity is deleted,
-- and the actor's name, role and school are copied in so they read as they were
-- at the time of the action. entity_id is NULL for actions on a whole list (exports).
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    action VARCHAR(50) NOT NULL,
    actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(150),
    actor_role VARCHAR(50),
    actor_school_id INT REFERENCES schools(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at);

-- Existing transfers only have their dates; who acted on them was never stored.
INSERT INTO audit_logs (entity_type, entity_id, action, note, created_at)
SELECT 'transfer', id, 'Created', 'Recorded before audit logging was enabled', COALESCE(date_initiated, CURRENT_TIMESTAMP)
FROM transfers;

INSERT INTO audit_logs (entity_type, entity_id, action, note, created_at)
SELECT 'transfer', id, 'Approved', 'Recorded before audit logging was enabled', date_accepted
FROM transfers
WHERE date_accepted IS NOT NULL;

-- +goose Down
DROP INDEX IF EXISTS idx_audit_logs_entity;

DROP TABLE IF EXISTS audit_logs;
