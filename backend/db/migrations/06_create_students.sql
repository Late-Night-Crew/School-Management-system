-- +goose Up
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    date_of_birth DATE,
    previous_school VARCHAR(150),
    guardian_name VARCHAR(150),
    form_level INT CHECK (form_level BETWEEN 1 AND 4),
    status VARCHAR(50) DEFAULT 'Active',
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id INT REFERENCES academic_years(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);

-- +goose Down
DROP INDEX IF EXISTS idx_students_school_id;
DROP TABLE IF EXISTS students;
