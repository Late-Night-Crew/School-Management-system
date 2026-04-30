-- +goose Up
CREATE TABLE IF NOT EXISTS student_subjects (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON student_subjects(subject_id);

-- +goose Down
DROP INDEX IF EXISTS idx_student_subjects_subject_id;
DROP INDEX IF EXISTS idx_student_subjects_student_id;
DROP TABLE IF EXISTS student_subjects;
