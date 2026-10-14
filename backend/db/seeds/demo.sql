-- Demo dataset, loaded by `nsms seed` (users are added by the command itself so
-- their passwords are hashed). Everything is identifiable by the DEMO- prefix on
-- school and student numbers. The command refuses to run twice.
--
-- Regions 3, districts 6, schools 12 (DEMO-001..012), academic years 2025-2027,
-- 12 students per school, subject enrolments, marks for 2025 (forms 2-4, terms 1-3)
-- and 2026 (terms 1-2), 2025 JCE/MSCE pass rates, and one transfer in each status.

-- Fixed seed so every run produces the same marks and pass rates
SELECT setseed(0.2026);

INSERT INTO regions (name)
VALUES ('Northern'), ('Central'), ('Southern')
ON CONFLICT (name) DO NOTHING;

INSERT INTO districts (name, region_id)
SELECT d.name, r.id
FROM (VALUES
    ('Mzuzu', 'Northern'), ('Karonga', 'Northern'),
    ('Lilongwe', 'Central'), ('Kasungu', 'Central'),
    ('Blantyre', 'Southern'), ('Zomba', 'Southern')
) AS d(name, region)
JOIN regions r ON r.name = d.region
ON CONFLICT (name, region_id) DO NOTHING;

-- Two schools per district, numbered DEMO-001.. in district-name order
INSERT INTO schools (name, school_number, district_id)
SELECT
    d.name || ' ' || s.suffix,
    'DEMO-' || lpad((row_number() OVER (ORDER BY d.name, s.suffix))::text, 3, '0'),
    d.id
FROM districts d
JOIN regions r ON r.id = d.region_id
CROSS JOIN (VALUES ('Demo Secondary School'), ('Demo Community Day Secondary School')) AS s(suffix)
WHERE (d.name, r.name) IN (
    ('Mzuzu', 'Northern'), ('Karonga', 'Northern'),
    ('Lilongwe', 'Central'), ('Kasungu', 'Central'),
    ('Blantyre', 'Southern'), ('Zomba', 'Southern')
)
ON CONFLICT (name, district_id) DO NOTHING;

INSERT INTO academic_years (year, start_date, end_date, status)
VALUES
    (2025, '2025-01-06', '2025-11-28', 'Completed'),
    (2026, '2026-01-05', '2026-11-27', 'Active'),
    (2027, '2027-01-04', '2027-11-26', 'Upcoming')
ON CONFLICT (year) DO NOTHING;

-- Term dates for each demo year (needed to move schools between terms, and for reminders)
INSERT INTO academic_year_terms (academic_year_id, term, start_date, end_date)
SELECT ay.id, t.term, make_date(ay.year, t.sm, t.sd), make_date(ay.year, t.em, t.ed)
FROM academic_years ay
    CROSS JOIN (VALUES (1, 1, 6, 4, 3), (2, 4, 20, 7, 24), (3, 8, 17, 11, 26)) AS t(term, sm, sd, em, ed)
WHERE ay.year IN (2025, 2026, 2027)
ON CONFLICT DO NOTHING;

-- Subjects are matched by name below, because codes differ between databases
-- (e.g. MATH vs MAT). Add any that are missing.
INSERT INTO subjects (code, name, description)
SELECT v.code, v.name, v.description
FROM (VALUES
    ('MATH', 'Mathematics', 'Mathematics subject'),
    ('ENG', 'English', 'English language'),
    ('CHI', 'Chichewa', 'Chichewa language'),
    ('SCI', 'Science', 'General Science'),
    ('BIO', 'Biology', 'Biology subject'),
    ('GEO', 'Geography', 'Geography subject'),
    ('HIST', 'History', 'History subject'),
    ('AGR', 'Agriculture', 'Agriculture subject')
) AS v(code, name, description)
WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE lower(s.name) = lower(v.name))
ON CONFLICT (code) DO NOTHING;

-- 12 students per school, three in each form; every 11th student has a disability
WITH
first_names(i, name, gender) AS (VALUES
    (0, 'Chikondi', 'Female'), (1, 'Kondwani', 'Male'), (2, 'Thokozani', 'Female'),
    (3, 'Mphatso', 'Male'), (4, 'Tiwonge', 'Female'), (5, 'Chimwemwe', 'Male'),
    (6, 'Takondwa', 'Female'), (7, 'Limbani', 'Male'), (8, 'Madalitso', 'Female'),
    (9, 'Yamikani', 'Male'), (10, 'Tadala', 'Female'), (11, 'Blessings', 'Male')
),
last_names(i, name) AS (VALUES
    (0, 'Banda'), (1, 'Phiri'), (2, 'Mwale'), (3, 'Chirwa'), (4, 'Nyirenda'),
    (5, 'Kachale'), (6, 'Mvula'), (7, 'Gondwe'), (8, 'Tembo'), (9, 'Kumwenda')
),
guardian_names(i, name) AS (VALUES
    (0, 'Grace'), (1, 'James'), (2, 'Esther'), (3, 'Peter'), (4, 'Mercy'), (5, 'John')
),
demo_schools AS (
    SELECT id, school_number, substring(school_number FROM 6)::int AS n
    FROM schools WHERE school_number LIKE 'DEMO-%'
)
INSERT INTO students (
    student_number, first_name, last_name, gender, date_of_birth, form_level, status,
    school_id, academic_year_id, guardian_name, guardian_phone, guardian_relationship,
    disability, disability_details
)
SELECT
    sc.school_number || '-' || lpad(k::text, 3, '0'),
    fn.name,
    ln.name,
    fn.gender,
    DATE '2012-01-01' - ((((k - 1) % 4) * 365) + (random() * 300)::int),
    ((k - 1) % 4) + 1,
    'Active',
    sc.id,
    ay.id,
    gn.name || ' ' || ln.name,
    '+26599' || lpad(((sc.n * 1000 + k) * 7919 % 10000000)::text, 7, '0'),
    'Parent',
    k % 11 = 0,
    CASE WHEN k % 11 = 0 THEN 'Visual impairment' END
FROM demo_schools sc
CROSS JOIN generate_series(1, 12) AS k
JOIN first_names fn ON fn.i = (sc.n * 5 + k) % 12
JOIN last_names ln ON ln.i = (sc.n * 3 + k * 7) % 10
JOIN guardian_names gn ON gn.i = (sc.n + k) % 6
JOIN academic_years ay ON ay.year = 2026
ON CONFLICT (student_number) DO NOTHING;

-- Core subjects for everyone, plus Biology/Geography or History/Agriculture
INSERT INTO student_subjects (student_id, subject_id)
SELECT s.id, sub.id
FROM students s
JOIN subjects sub ON lower(sub.name) IN ('mathematics', 'english', 'chichewa', 'science', 'biology', 'geography', 'history', 'agriculture')
WHERE s.student_number LIKE 'DEMO-%'
    AND (
        lower(sub.name) IN ('mathematics', 'english', 'chichewa', 'science')
        OR (lower(sub.name) IN ('biology', 'geography') AND s.id % 2 = 0)
        OR (lower(sub.name) IN ('history', 'agriculture') AND s.id % 2 = 1)
    )
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- Each student has a steady ability (40-84) with term-to-term variation.
-- 2025: terms 1-3 for students now in forms 2-4; 2026: terms 1-2 so far.
INSERT INTO student_marks (student_id, subject_id, academic_year_id, term, mark, school_id)
SELECT
    ss.student_id,
    ss.subject_id,
    ay.id,
    t.term,
    LEAST(100, GREATEST(0, 40 + (s.id * 37) % 45 + (random() * 30)::int - 15)),
    s.school_id
FROM student_subjects ss
JOIN students s ON s.id = ss.student_id
JOIN academic_years ay ON ay.year IN (2025, 2026)
JOIN generate_series(1, 3) AS t(term)
    ON (ay.year = 2025 AND s.form_level >= 2) OR (ay.year = 2026 AND t.term <= 2)
WHERE s.student_number LIKE 'DEMO-%'
ON CONFLICT (student_id, subject_id, academic_year_id, term) DO NOTHING;

INSERT INTO exam_results (school_id, academic_year_id, jce_pass_rate, msce_pass_rate)
SELECT sc.id, ay.id, round((55 + random() * 35)::numeric, 2), round((40 + random() * 40)::numeric, 2)
FROM schools sc
JOIN academic_years ay ON ay.year = 2025
WHERE sc.school_number LIKE 'DEMO-%'
ON CONFLICT (school_id, academic_year_id) DO NOTHING;

-- One transfer in each status, including one across regions (Lilongwe -> Mzuzu).
-- Accepted and Completed transfers have already moved the student.
WITH demo_transfers(student_number, from_number, to_number, status, reason, rejection_reason, days_ago) AS (VALUES
    ('DEMO-001-003', 'DEMO-001', 'DEMO-002', 'Pending', 'Family relocation within Blantyre', NULL, 3),
    ('DEMO-007-004', 'DEMO-007', 'DEMO-009', 'Pending', 'Parent posted to Mzuzu', NULL, 1),
    ('DEMO-003-002', 'DEMO-003', 'DEMO-004', 'Rejected', 'Closer to home', 'No space in Form 2 this term', 20),
    ('DEMO-011-005', 'DEMO-011', 'DEMO-012', 'Accepted', 'Offered a boarding place', NULL, 12),
    ('DEMO-005-006', 'DEMO-005', 'DEMO-010', 'Completed', 'Family relocation', NULL, 40)
),
inserted AS (
    INSERT INTO transfers (student_id, from_school, to_school, status, date_initiated, date_accepted, reason, rejection_reason)
    SELECT
        s.id,
        fs.id,
        ts.id,
        dt.status,
        now() - make_interval(days => dt.days_ago),
        CASE WHEN dt.status IN ('Accepted', 'Completed') THEN now() - make_interval(days => dt.days_ago - 2) END,
        dt.reason,
        dt.rejection_reason
    FROM demo_transfers dt
    JOIN students s ON s.student_number = dt.student_number
    JOIN schools fs ON fs.school_number = dt.from_number
    JOIN schools ts ON ts.school_number = dt.to_number
    RETURNING student_id, to_school, status
)
UPDATE students
SET school_id = inserted.to_school, updated_at = now()
FROM inserted
WHERE students.id = inserted.student_id
    AND inserted.status IN ('Accepted', 'Completed');

-- Demo schools are in Term 3 of 2026: Terms 1 and 2 have marks and Term 3 is under way
INSERT INTO school_stages (school_id, academic_year_id, term)
SELECT sc.id, ay.id, 3
FROM schools sc CROSS JOIN academic_years ay
WHERE sc.school_number LIKE 'DEMO-%' AND ay.year = 2026
ON CONFLICT (school_id) DO NOTHING;
