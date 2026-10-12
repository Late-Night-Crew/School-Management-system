-- +goose Up
-- Deleting a division, district or school used to cascade: a division took its
-- districts, their schools, and every student, mark, transfer and exam result with it.
-- Now the database refuses to delete anything that still has records under it. The app
-- checks first and explains what is in the way: move districts or schools elsewhere, or
-- close a school instead of deleting it. Removing a student still removes that student's
-- own marks, subjects and transfers.
ALTER TABLE districts
    DROP CONSTRAINT IF EXISTS districts_region_id_fkey,
    ADD CONSTRAINT districts_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE RESTRICT;

ALTER TABLE schools
    DROP CONSTRAINT IF EXISTS schools_district_id_fkey,
    ADD CONSTRAINT schools_district_id_fkey FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE RESTRICT;

ALTER TABLE students
    DROP CONSTRAINT IF EXISTS students_school_id_fkey,
    ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

ALTER TABLE exam_results
    DROP CONSTRAINT IF EXISTS exam_results_school_id_fkey,
    ADD CONSTRAINT exam_results_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

ALTER TABLE transfers
    DROP CONSTRAINT IF EXISTS transfers_from_school_fkey,
    ADD CONSTRAINT transfers_from_school_fkey FOREIGN KEY (from_school) REFERENCES schools(id) ON DELETE RESTRICT,
    DROP CONSTRAINT IF EXISTS transfers_to_school_fkey,
    ADD CONSTRAINT transfers_to_school_fkey FOREIGN KEY (to_school) REFERENCES schools(id) ON DELETE RESTRICT;

ALTER TABLE student_marks
    DROP CONSTRAINT IF EXISTS student_marks_school_id_fkey,
    ADD CONSTRAINT student_marks_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- A closed school keeps all its records but takes no new students, transfers or
-- accounts, and its managers' accounts are deactivated when it closes.
ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP NULL;

-- School managers' accounts copy their school's district and region. Editing a school's
-- district (or a district's division) did not update them; bring them back in line.
UPDATE users u
SET district_id = sc.district_id, region_id = d.region_id
FROM schools sc
JOIN districts d ON d.id = sc.district_id
WHERE u.school_id = sc.id
    AND (u.district_id IS DISTINCT FROM sc.district_id OR u.region_id IS DISTINCT FROM d.region_id);

-- +goose Down
ALTER TABLE schools
    DROP COLUMN IF EXISTS closed_at;

ALTER TABLE student_marks
    DROP CONSTRAINT IF EXISTS student_marks_school_id_fkey,
    ADD CONSTRAINT student_marks_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE transfers
    DROP CONSTRAINT IF EXISTS transfers_from_school_fkey,
    ADD CONSTRAINT transfers_from_school_fkey FOREIGN KEY (from_school) REFERENCES schools(id) ON DELETE CASCADE,
    DROP CONSTRAINT IF EXISTS transfers_to_school_fkey,
    ADD CONSTRAINT transfers_to_school_fkey FOREIGN KEY (to_school) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exam_results
    DROP CONSTRAINT IF EXISTS exam_results_school_id_fkey,
    ADD CONSTRAINT exam_results_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE students
    DROP CONSTRAINT IF EXISTS students_school_id_fkey,
    ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE schools
    DROP CONSTRAINT IF EXISTS schools_district_id_fkey,
    ADD CONSTRAINT schools_district_id_fkey FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE;

ALTER TABLE districts
    DROP CONSTRAINT IF EXISTS districts_region_id_fkey,
    ADD CONSTRAINT districts_region_id_fkey FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE;
