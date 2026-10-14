-- +goose Up
-- National exam pass rules and end-of-term reports.
--
-- Term 3 marks of Form 2 and Form 4 are the JCE and MSCE results, so passing them
-- follows MANEB's rule rather than the plain promotion rule: a number of subjects
-- (jce_subjects_to_pass / msce_subjects_to_pass) and every compulsory subject
-- (English by default). Forms 1 and 3 keep promotion_settings.subjects_to_pass.
ALTER TABLE promotion_settings
    ADD COLUMN IF NOT EXISTS jce_subjects_to_pass INT NOT NULL DEFAULT 6 CHECK (jce_subjects_to_pass BETWEEN 1 AND 20),
    ADD COLUMN IF NOT EXISTS msce_subjects_to_pass INT NOT NULL DEFAULT 6 CHECK (msce_subjects_to_pass BETWEEN 1 AND 20);

CREATE TABLE IF NOT EXISTS exam_compulsory_subjects (
    exam VARCHAR(10) NOT NULL CHECK (exam IN ('JCE', 'MSCE')),
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (exam, subject_id)
);

INSERT INTO exam_compulsory_subjects (exam, subject_id)
SELECT exam, s.id
FROM subjects s CROSS JOIN (VALUES ('JCE'), ('MSCE')) AS e(exam)
WHERE UPPER(s.code) = 'ENG' OR LOWER(s.name) = 'english'
ON CONFLICT DO NOTHING;

-- A school's report for one term, saved when the term closes (moving to the next
-- term, or finishing the year) so past figures stay as they were. marks_fingerprint is
-- a hash of the term's marks at that moment: if marks are corrected later the report
-- shows it is out of date, and the coordinator or MCDE can regenerate it (audited).
-- The headline figures have columns for the national and division tables; the
-- breakdown by form and subject is in details.
CREATE TABLE IF NOT EXISTS term_reports (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term INT NOT NULL CHECK (term BETWEEN 1 AND 3),
    learners_assessed INT NOT NULL,
    average_mark DOUBLE PRECISION,
    pass_rate DOUBLE PRECISION,
    jce_pass_rate DOUBLE PRECISION,
    msce_pass_rate DOUBLE PRECISION,
    details JSONB NOT NULL DEFAULT '{}',
    marks_fingerprint TEXT NOT NULL,
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, academic_year_id, term)
);

CREATE INDEX IF NOT EXISTS idx_term_reports_year_term ON term_reports(academic_year_id, term);

-- +goose Down
DROP INDEX IF EXISTS idx_term_reports_year_term;

DROP TABLE IF EXISTS term_reports;

DROP TABLE IF EXISTS exam_compulsory_subjects;

ALTER TABLE promotion_settings
    DROP COLUMN IF EXISTS jce_subjects_to_pass,
    DROP COLUMN IF EXISTS msce_subjects_to_pass;
