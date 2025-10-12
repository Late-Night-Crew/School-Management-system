-- +goose Up
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- +goose Down

DROP TABLE IF EXISTS regions;