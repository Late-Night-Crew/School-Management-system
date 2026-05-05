-- +goose Up
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS guardian_alt_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(100),
    ADD COLUMN IF NOT EXISTS previous_school_id INT REFERENCES schools(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS disability BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS disability_details VARCHAR(255);

-- +goose Down
ALTER TABLE students
    DROP COLUMN IF EXISTS disability_details,
    DROP COLUMN IF EXISTS disability,
    DROP COLUMN IF EXISTS previous_school_id,
    DROP COLUMN IF EXISTS guardian_relationship,
    DROP COLUMN IF EXISTS guardian_email,
    DROP COLUMN IF EXISTS guardian_alt_phone,
    DROP COLUMN IF EXISTS guardian_phone,
    DROP COLUMN IF EXISTS middle_name;
