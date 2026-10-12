-- +goose Up
-- The grading scale for subject marks (0-100), set by the super admin.
-- A band covers marks from min_mark up to one below the next band's min_mark (the top
-- band runs to 100), so the bands always cover 0-100 without gaps. is_pass marks the
-- bands that count as a pass; the pass mark is the lowest min_mark of those bands.
CREATE TABLE IF NOT EXISTS grade_bands (
    id SERIAL PRIMARY KEY,
    grade VARCHAR(10) NOT NULL UNIQUE,
    min_mark INT NOT NULL UNIQUE CHECK (min_mark BETWEEN 0 AND 100),
    is_pass BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The scale the screens used before it could be changed
INSERT INTO grade_bands (grade, min_mark, is_pass, description) VALUES
    ('A', 90, TRUE, 'Distinction'),
    ('B', 80, TRUE, 'Very good'),
    ('C', 70, TRUE, 'Good'),
    ('D', 60, TRUE, 'Credit'),
    ('E', 40, TRUE, 'Pass'),
    ('F', 0, FALSE, 'Fail')
ON CONFLICT DO NOTHING;

-- +goose Down
DROP TABLE IF EXISTS grade_bands;
