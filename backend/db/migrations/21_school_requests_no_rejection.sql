-- +goose Up
-- MCDE does not reject applications (client decision), so a request is a draft, then
-- submitted, then accepted. Any request rejected before this change goes back to the
-- division as a draft.
UPDATE school_requests SET status = 'Draft' WHERE status = 'Rejected';

ALTER TABLE school_requests
    DROP CONSTRAINT IF EXISTS school_requests_status_check,
    ADD CONSTRAINT school_requests_status_check CHECK (status IN ('Draft', 'Submitted', 'Accepted')),
    DROP COLUMN IF EXISTS rejection_reason;

-- +goose Down
ALTER TABLE school_requests
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
    DROP CONSTRAINT IF EXISTS school_requests_status_check,
    ADD CONSTRAINT school_requests_status_check CHECK (status IN ('Draft', 'Submitted', 'Accepted', 'Rejected'));
