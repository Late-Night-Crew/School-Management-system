-- +goose Up
-- "Forgot password" requests from the sign-in page. There is no email service, so a
-- person who forgot their password asks the office above them: a division officer's
-- request goes to MCDE (handler_region_id NULL), a school user's to their division
-- (handler_region_id = the school's region). The handler resets the password in the
-- app and passes the temporary password on, then the request is resolved.
-- Requests are only stored when the details match an active account; the sign-in page
-- answers the same either way, so it cannot be used to find out who has an account.
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handler_region_id INT REFERENCES regions(id) ON DELETE SET NULL,
    contact_phone VARCHAR(30),
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved', 'Dismissed')),
    requester_ip VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP
);

-- One open request per person; asking again while one is pending changes nothing
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_reset_per_user ON password_reset_requests(user_id)
WHERE
    status = 'Pending';

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_handler ON password_reset_requests(status, handler_region_id);

-- +goose Down
DROP INDEX IF EXISTS idx_password_reset_requests_handler;

DROP INDEX IF EXISTS one_pending_reset_per_user;

DROP TABLE IF EXISTS password_reset_requests;
