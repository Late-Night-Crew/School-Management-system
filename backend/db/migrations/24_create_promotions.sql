-- +goose Up
-- Moving learners through the school year. Terms are stages: each school's current
-- term moves 1 -> 2 -> 3 (the coordinator for their school, or MCDE). Term 3 decides
-- the year: a learner who passes at least subjects_to_pass subjects (marks at or above
-- the grading scale's pass mark) moves up. Failing learners repeat, except that Form 1
-- and Form 3 learners may be allowed to proceed; Form 2 (JCE) learners who fail repeat
-- Form 2; Form 4 learners who pass the national exams are completed, and those who fail
-- re-enrol in Form 4 to rewrite. Finishing Term 3 moves the school to Term 1 of the
-- next academic year.

-- One row of settings, set by the super admin. automatic: learners who pass are moved
-- up for every school at once; otherwise each coordinator confirms their school.
CREATE TABLE IF NOT EXISTS promotion_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    automatic BOOLEAN NOT NULL DEFAULT FALSE,
    subjects_to_pass INT NOT NULL DEFAULT 6 CHECK (subjects_to_pass BETWEEN 1 AND 20),
    updated_by INT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO promotion_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Each school's current academic year and term. A school without a row is in Term 1
-- of the active academic year.
CREATE TABLE IF NOT EXISTS school_stages (
    school_id INT PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    term INT NOT NULL CHECK (term BETWEEN 1 AND 3),
    updated_by INT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Each learner's year-end result: how many subjects they passed in Term 3 and what
-- was decided. Promoted/Proceeded move up a form, Repeat stays, Completed finishes
-- Form 4, Rewrite re-enrols in Form 4.
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    school_id INT REFERENCES schools(id) ON DELETE SET NULL,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    from_form INT NOT NULL CHECK (from_form BETWEEN 1 AND 4),
    to_form INT NOT NULL CHECK (to_form BETWEEN 1 AND 4),
    subjects_passed INT NOT NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('Promoted', 'Repeat', 'Proceeded', 'Completed', 'Rewrite')),
    automatic BOOLEAN NOT NULL DEFAULT FALSE,
    decided_by INT REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_promotions_school_year ON promotions(school_id, academic_year_id);

-- +goose Down
DROP INDEX IF EXISTS idx_promotions_school_year;

DROP TABLE IF EXISTS promotions;

DROP TABLE IF EXISTS school_stages;

DROP TABLE IF EXISTS promotion_settings;
