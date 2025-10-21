
-- name: FindUserLoginByEmail :one
SELECT id, display_name, email, password, last_login_at FROM users WHERE email = $1 AND is_activated AND deleted_at IS NULL;

-- name: CreateRegion :one
INSERT INTO regions (name) VALUES ($1) RETURNING id, name;

-- name: ListRegions :many
SELECT id, name FROM regions ORDER BY name;

-- name: DeleteRegion :exec
DELETE FROM regions WHERE id = $1;

-- name: FindRegionById :one
SELECT id, name FROM regions WHERE id = $1;

-- name: UpdateRegion :one
UPDATE regions SET name = $2 WHERE id = $1 RETURNING id, name;