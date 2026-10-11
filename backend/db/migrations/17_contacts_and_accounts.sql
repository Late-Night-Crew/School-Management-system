-- +goose Up
-- Contact details for people and offices, and what account management needs.
-- Phone numbers are stored in international form, e.g. +265991234567.

-- A person's own numbers. must_change_password is set for new accounts and after an
-- admin resets a password, so temporary passwords are replaced at first sign-in.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- The division (regional) office's own details, which stay when its admin changes.
ALTER TABLE regions
    ADD COLUMN IF NOT EXISTS office_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS office_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS postal_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS physical_address VARCHAR(255);

-- The school office and its head teacher, who may not be the person using NSMS.
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS postal_address VARCHAR(255),
    ADD COLUMN IF NOT EXISTS head_teacher_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS head_teacher_phone VARCHAR(20);

-- One regional admin per region counts only active accounts, so a deactivated admin
-- can be replaced while their account (and its history) is kept.
DROP INDEX IF EXISTS unique_regional_admin_per_region;

CREATE UNIQUE INDEX IF NOT EXISTS unique_regional_admin_per_region ON users(region_id)
WHERE
    role = 'REGIONAL_ADMIN' AND is_activated AND deleted_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS unique_regional_admin_per_region;

CREATE UNIQUE INDEX IF NOT EXISTS unique_regional_admin_per_region ON users(region_id)
WHERE
    role = 'REGIONAL_ADMIN';

ALTER TABLE schools
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS postal_address,
    DROP COLUMN IF EXISTS head_teacher_name,
    DROP COLUMN IF EXISTS head_teacher_phone;

ALTER TABLE regions
    DROP COLUMN IF EXISTS office_phone,
    DROP COLUMN IF EXISTS office_email,
    DROP COLUMN IF EXISTS postal_address,
    DROP COLUMN IF EXISTS physical_address;

ALTER TABLE users
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS whatsapp,
    DROP COLUMN IF EXISTS must_change_password;
