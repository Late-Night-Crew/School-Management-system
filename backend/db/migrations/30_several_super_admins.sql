-- +goose Up
-- More than one MCDE (super admin) account: a system this size needs several people
-- managing it, and the audit log records which of them did what.
DROP INDEX IF EXISTS unique_super_admin;

UPDATE users SET is_super_admin = (role = 'SUPER_ADMIN') WHERE is_super_admin IS DISTINCT FROM (role = 'SUPER_ADMIN');

-- +goose Down
-- Recreating the index fails while there is more than one super admin.
CREATE UNIQUE INDEX IF NOT EXISTS unique_super_admin ON users(role) WHERE role = 'SUPER_ADMIN';
