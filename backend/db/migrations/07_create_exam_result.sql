-- +goose Up
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    jce_pass_rate DECIMAL(5, 2),
    msce_pass_rate DECIMAL(5, 2),
    UNIQUE (school_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_school_id ON exam_results(school_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_academic_year_id ON exam_results(academic_year_id);

-- +goose Down
DROP INDEX IF EXISTS idx_exam_results_school_id;

DROP INDEX IF EXISTS idx_exam_results_academic_year_id;

DROP TABLE IF EXISTS exam_results;