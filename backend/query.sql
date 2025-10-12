
-- name: FindUserLoginByEmail :one
SELECT id, display_name, email, password, last_login_at FROM users WHERE email = $1 AND is_activated AND deleted_at IS NULL;