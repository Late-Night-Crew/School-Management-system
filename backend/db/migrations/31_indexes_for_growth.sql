-- +goose Up
-- Indexes for the lists and counts that grow with the number of schools, learners and
-- years (measured on 400 schools, 60,000 learners and 300,000 activity log entries).

-- Activity log: newest first, and by person
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);

-- Learners: counted per school by status everywhere (dashboards, reports, year end),
-- and listed by name. The school index covers what idx_students_school_id did.
CREATE INDEX IF NOT EXISTS idx_students_school_status ON students(school_id, status);
DROP INDEX IF EXISTS idx_students_school_id;
CREATE INDEX IF NOT EXISTS idx_students_by_name ON students(last_name, first_name, id);
-- Foreign keys that are set to NULL when a year or school is deleted
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_previous_school ON students(previous_school_id);

-- Marks are read one school, year and term at a time
CREATE INDEX IF NOT EXISTS idx_student_marks_school_year_term ON student_marks(school_id, academic_year_id, term);
DROP INDEX IF EXISTS idx_student_marks_school_year;

-- Transfer history, newest first
CREATE INDEX IF NOT EXISTS idx_transfers_initiated ON transfers(date_initiated DESC, id DESC);

-- Already covered by the unique constraints that start with the same column
DROP INDEX IF EXISTS idx_student_marks_student_id;
DROP INDEX IF EXISTS idx_student_subjects_student_id;
DROP INDEX IF EXISTS idx_exam_results_school_id;

-- +goose Down
CREATE INDEX IF NOT EXISTS idx_exam_results_school_id ON exam_results(school_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_student_id ON student_marks(student_id);
DROP INDEX IF EXISTS idx_transfers_initiated;
CREATE INDEX IF NOT EXISTS idx_student_marks_school_year ON student_marks(school_id, academic_year_id);
DROP INDEX IF EXISTS idx_student_marks_school_year_term;
DROP INDEX IF EXISTS idx_students_previous_school;
DROP INDEX IF EXISTS idx_students_academic_year;
DROP INDEX IF EXISTS idx_students_by_name;
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
DROP INDEX IF EXISTS idx_students_school_status;
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_created;
