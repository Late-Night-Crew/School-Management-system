-- +goose Up
-- Requests to register a new Open Secondary School: the online version of MCDE's paper
-- registration form. A division officer fills it in for a school in their division
-- (Draft), submits it (which stands for the division's recommendation), and the super
-- admin accepts it, giving the registration number and creating the school, or rejects
-- it with a reason. A rejected request can be edited and submitted again.
--
-- The form itself (host school, head teacher, venue, facilitators, coordinator,
-- enrolment, PTA and district endorsements) is kept as a JSON document so its fields
-- can change without a migration; the columns are what the screens filter and join on.
-- Every step is written to audit_logs (entity 'school_request').
CREATE TABLE IF NOT EXISTS school_requests (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Accepted', 'Rejected')),
    region_id INT REFERENCES regions(id) ON DELETE SET NULL,
    district_id INT REFERENCES districts(id) ON DELETE SET NULL,
    school_name VARCHAR(100) NOT NULL DEFAULT '',
    form JSONB NOT NULL DEFAULT '{}',
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    submitted_by INT REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP,
    decided_by INT REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMP,
    registration_number VARCHAR(100),
    rejection_reason TEXT,
    -- The school created when the request was accepted
    school_id INT REFERENCES schools(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_school_requests_region_status ON school_requests(region_id, status);

CREATE INDEX IF NOT EXISTS idx_school_requests_status ON school_requests(status, submitted_at);

-- +goose Down
DROP INDEX IF EXISTS idx_school_requests_status;

DROP INDEX IF EXISTS idx_school_requests_region_status;

DROP TABLE IF EXISTS school_requests;
