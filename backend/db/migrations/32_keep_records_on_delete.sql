-- +goose Up
-- Deleting a learner, academic year or subject no longer silently deletes the marks,
-- results, transfers and reports that refer to it: the database refuses instead, and
-- the app explains what is in the way (the same rule as for schools, migration 19).

-- +goose StatementBegin
DO $$
DECLARE
    r record;
    fk text;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('student_marks', 'student_id', 'students'),
        ('student_marks', 'academic_year_id', 'academic_years'),
        ('student_marks', 'subject_id', 'subjects'),
        ('student_subjects', 'subject_id', 'subjects'),
        ('promotions', 'student_id', 'students'),
        ('promotions', 'academic_year_id', 'academic_years'),
        ('transfers', 'student_id', 'students'),
        ('exam_results', 'academic_year_id', 'academic_years'),
        ('term_reports', 'academic_year_id', 'academic_years')
    ) AS t(tbl, col, ref) LOOP
        SELECT c.conname INTO fk
        FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND c.conrelid = r.tbl::regclass AND a.attname = r.col
            AND array_length(c.conkey, 1) = 1;
        IF fk IS NULL THEN
            RAISE EXCEPTION 'no foreign key on %.%', r.tbl, r.col;
        END IF;
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.tbl, fk);
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(id) ON DELETE RESTRICT',
            r.tbl, fk, r.col, r.ref);
    END LOOP;
END $$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DO $$
DECLARE
    r record;
    fk text;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('student_marks', 'student_id', 'students'),
        ('student_marks', 'academic_year_id', 'academic_years'),
        ('student_marks', 'subject_id', 'subjects'),
        ('student_subjects', 'subject_id', 'subjects'),
        ('promotions', 'student_id', 'students'),
        ('promotions', 'academic_year_id', 'academic_years'),
        ('transfers', 'student_id', 'students'),
        ('exam_results', 'academic_year_id', 'academic_years'),
        ('term_reports', 'academic_year_id', 'academic_years')
    ) AS t(tbl, col, ref) LOOP
        SELECT c.conname INTO fk
        FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND c.conrelid = r.tbl::regclass AND a.attname = r.col
            AND array_length(c.conkey, 1) = 1;
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', r.tbl, fk);
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(id) ON DELETE CASCADE',
            r.tbl, fk, r.col, r.ref);
    END LOOP;
END $$;
-- +goose StatementEnd
