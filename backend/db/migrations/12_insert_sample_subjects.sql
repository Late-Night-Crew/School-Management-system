-- +goose Up
INSERT INTO subjects (name, code, description, created_at, updated_at) VALUES
('Mathematics', 'MATH', 'Mathematics subject', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('English', 'ENG', 'English language', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Science', 'SCI', 'General Science', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('History', 'HIST', 'History subject', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Geography', 'GEO', 'Geography subject', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- +goose Down
DELETE FROM subjects WHERE code IN ('MATH', 'ENG', 'SCI', 'HIST', 'GEO');