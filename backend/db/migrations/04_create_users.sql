-- +goose Up
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('SUPER_ADMIN', 'REGIONAL_ADMIN', 'SCHOOL_MANAGER')
    ),
    region_id INT REFERENCES regions(id) ON DELETE
    SET
        NULL,
        district_id INT REFERENCES districts(id) ON DELETE
    SET
        NULL,
        school_id INT REFERENCES schools(id) ON DELETE
    SET
        NULL,
        last_login_at TIMESTAMP,
        is_super_admin BOOLEAN DEFAULT FALSE,
        is_activated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_region_id ON users(region_id);

CREATE INDEX IF NOT EXISTS idx_users_district_id ON users(district_id);

CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);

-- Unique role constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_regional_admin_per_region ON users(region_id)
WHERE
    role = 'REGIONAL_ADMIN';

CREATE UNIQUE INDEX IF NOT EXISTS unique_super_admin ON users(role)
WHERE
    role = 'SUPER_ADMIN';

-- +goose Down
DROP INDEX IF EXISTS idx_users_region_id;

DROP INDEX IF EXISTS idx_users_district_id;

DROP INDEX IF EXISTS idx_users_school_id;

DROP INDEX IF EXISTS unique_regional_admin_per_region;

DROP INDEX IF EXISTS unique_super_admin;

DROP TABLE IF EXISTS users;