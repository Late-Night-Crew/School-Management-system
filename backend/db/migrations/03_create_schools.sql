-- +goose Up
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    school_number VARCHAR(100) NOT NULL,
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    UNIQUE(name, district_id)
);

CREATE INDEX IF NOT EXISTS idx_schools_district_id ON schools(district_id);

-- +goose Down
DROP INDEX IF EXISTS idx_schools_district_id;
DROP TABLE IF EXISTS schools;
