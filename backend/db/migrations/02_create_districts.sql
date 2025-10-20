-- +goose Up
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region_id INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    UNIQUE(name, region_id)
);

CREATE INDEX IF NOT EXISTS idx_districts_region_id ON districts(region_id);

-- +goose Down
DROP INDEX IF EXISTS idx_districts_region_id;
DROP TABLE IF EXISTS districts;
