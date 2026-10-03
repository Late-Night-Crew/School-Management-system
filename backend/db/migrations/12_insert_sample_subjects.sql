-- +goose Up
-- Sample subjects. Skips any subject whose code or name already exists, so databases
-- with their own subject list (loaded before this migration) are left as they are.
INSERT INTO subjects (name, code, description, created_at, updated_at)
SELECT v.name, v.code, v.description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Mathematics', 'MATH', 'Mathematics subject'),
    ('English', 'ENG', 'English language'),
    ('Science', 'SCI', 'General Science'),
    ('History', 'HIST', 'History subject'),
    ('Geography', 'GEO', 'Geography subject')
) AS v(name, code, description)
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.code = v.code OR lower(s.name) = lower(v.name)
);

-- +goose Down
-- Intentionally empty: subjects may already be assigned to students or have marks,
-- and some of these codes may belong to a subject list that predates this migration.
SELECT 1;
