-- +goose Up
-- One mark (0-100) per student, subject, academic year and term.
-- school_id is the school where the mark was recorded, so a transferred
-- student's earlier marks still show which school awarded them.
CREATE TABLE IF NOT EXISTS student_marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term INT NOT NULL CHECK (term BETWEEN 1 AND 3),
    mark INT NOT NULL CHECK (mark BETWEEN 0 AND 100),
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, subject_id, academic_year_id, term)
);

CREATE INDEX IF NOT EXISTS idx_student_marks_school_year ON student_marks(school_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_student_marks_student_id ON student_marks(student_id);

-- +goose Down
DROP INDEX IF EXISTS idx_student_marks_student_id;

DROP INDEX IF EXISTS idx_student_marks_school_year;

DROP TABLE IF EXISTS student_marks;
