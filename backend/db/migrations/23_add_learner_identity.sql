-- +goose Up
-- Telling learners apart: two learners can share a name, so each can carry their
-- National ID and, from Form 2, their JCE examination number. Both are optional (Form 1
-- applicants often have neither) but unique when given. Learners without them are
-- checked for likely duplicates by name, date of birth and guardian phone in the app.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS national_id VARCHAR(20),
    ADD COLUMN IF NOT EXISTS jce_number VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_national_id ON students(UPPER(national_id))
WHERE
    national_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_jce_number ON students(UPPER(jce_number))
WHERE
    jce_number IS NOT NULL;

-- For the likely-duplicate check
CREATE INDEX IF NOT EXISTS idx_students_name ON students(LOWER(last_name), LOWER(first_name));

-- +goose Down
DROP INDEX IF EXISTS idx_students_name;

DROP INDEX IF EXISTS unique_student_jce_number;

DROP INDEX IF EXISTS unique_student_national_id;

ALTER TABLE students
    DROP COLUMN IF EXISTS jce_number,
    DROP COLUMN IF EXISTS national_id;
