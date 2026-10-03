-- name: FindUserLoginByEmail :one
SELECT
    id,
    display_name,
    email,
    role,
    region_id,
    district_id,
    school_id,
    password,
    last_login_at
FROM
    users
WHERE
    email = $1
    AND is_activated
    AND deleted_at IS NULL;

-- name: CreateRegion :one
INSERT INTO
    regions (name)
VALUES
    ($1) RETURNING id,
    name;

-- name: ListRegions :many
SELECT
    id,
    name
FROM
    regions
ORDER BY
    name;

-- name: DeleteRegion :exec
DELETE FROM
    regions
WHERE
    id = $1;

-- name: FindRegionById :one
SELECT
    id,
    name
FROM
    regions
WHERE
    id = $1;

-- name: UpdateRegion :one
UPDATE
    regions
SET
    name = $2
WHERE
    id = $1 RETURNING id,
    name;

-- name: CreateDistrict :one
INSERT INTO
    districts (name, region_id)
VALUES
    ($1, $2) RETURNING id,
    name,
    region_id;

-- name: ListDistricts :many
SELECT
    id,
    name,
    region_id
FROM
    districts
ORDER BY
    name;

-- name: DeleteDistrict :exec
DELETE FROM
    districts
WHERE
    id = $1;

-- name: FindDistrictById :one
SELECT
    id,
    name,
    region_id
FROM
    districts
WHERE
    id = $1;

-- name: UpdateDistrict :one
UPDATE
    districts
SET
    name = $2,
    region_id = $3
WHERE
    id = $1 RETURNING id,
    name,
    region_id;

-- name: ListDistrictsByRegionId :many
SELECT
    id,
    name,
    region_id
FROM
    districts
WHERE
    region_id = $1
ORDER BY
    name;

-- name: CreateSchool :one
INSERT INTO
    schools (school_number, name, district_id)
VALUES
    ($1, $2, $3) RETURNING id,
    school_number,
    name,
    district_id;

-- name: ListSchools :many
SELECT
    id,
    school_number,
    name,
    district_id
FROM
    schools
ORDER BY
    name;

-- name: DeleteSchool :exec
DELETE FROM
    schools
WHERE
    id = $1;

-- name: FindSchoolById :one
SELECT
    id,
    school_number,
    name,
    district_id
FROM
    schools
WHERE
    id = $1;

-- name: UpdateSchool :one
UPDATE
    schools
SET
    school_number = $2,
    name = $3,
    district_id = $4
WHERE
    id = $1 RETURNING id,
    school_number,
    name,
    district_id;

-- name: ListSchoolsByDistrictId :many
SELECT
    id,
    school_number,
    name,
    district_id
FROM
    schools
WHERE
    district_id = $1
ORDER BY
    name;

-- name: CreateUser :one
INSERT INTO
    users (
        display_name,
        email,
        password,
        role,
        region_id,
        district_id,
        school_id,
        is_super_admin
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id,
    display_name,
    email,
    role,
    region_id,
    district_id,
    school_id,
    is_super_admin,
    last_login_at;

-- name: ListUsers :many
SELECT
    id,
    display_name,
    email,
    role,
    region_id,
    district_id,
    school_id,
    is_super_admin,
    last_login_at
FROM
    users
WHERE
    deleted_at IS NULL
ORDER BY
    role;

-- name: DeleteUser :exec
UPDATE
    users
SET
    deleted_at = NOW()
WHERE
    id = $1;

-- name: FindUserById :one
SELECT
    id,
    display_name,
    email,
    role,
    region_id,
    district_id,
    school_id,
    is_super_admin,
    last_login_at
FROM
    users
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: UpdateUser :one
UPDATE
    users
SET
    display_name = $2,
    email = $3,
    role = $4,
    region_id = $5,
    district_id = $6,
    school_id = $7,
    is_super_admin = $8
WHERE
    id = $1
    AND deleted_at IS NULL RETURNING id,
    display_name,
    email,
    role,
    region_id,
    district_id,
    school_id,
    is_super_admin,
    last_login_at;

-- name: UpdateUserPassword :exec
UPDATE
    users
SET
    password = $2
WHERE
    id = $1
    AND deleted_at IS NULL;

-- name: CreateStudent :one
INSERT INTO
    students (
        student_number,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        gender,
        form_level,
        guardian_name,
        guardian_phone,
        guardian_alt_phone,
        guardian_email,
        guardian_relationship,
        previous_school,
        previous_school_id,
        school_id,
        academic_year_id,
        disability,
        disability_details,
        status
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at;

-- name: GetStudentByID :one
SELECT
    id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at
FROM
    students
WHERE
    id = $1;

-- name: ListStudents :many
SELECT
    id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at
FROM
    students
ORDER BY
    id DESC
LIMIT
    $1 OFFSET $2;

-- name: UpdateStudent :one
UPDATE
    students
SET
    student_number = $2,
    first_name = $3,
    middle_name = $4,
    last_name = $5,
    date_of_birth = $6,
    gender = $7,
    form_level = $8,
    guardian_name = $9,
    guardian_phone = $10,
    guardian_alt_phone = $11,
    guardian_email = $12,
    guardian_relationship = $13,
    previous_school = $14,
    previous_school_id = $15,
    school_id = $16,
    academic_year_id = $17,
    disability = $18,
    disability_details = $19,
    status = $20,
    updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at;

-- name: DeleteStudent :exec
DELETE FROM
    students
WHERE
    id = $1;

-- name: GetStudentsBySchoolID :many
SELECT
    id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at
FROM
    students
WHERE
    school_id = $1
ORDER BY
    last_name ASC,
    first_name ASC;

-- name: GetStudentByIDAndSchoolID :one
SELECT
    id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at
FROM
    students
WHERE
    id = $1
    AND school_id = $2;

-- name: UpdateStudentByIDAndSchoolID :one
UPDATE
    students
SET
    student_number = $2,
    first_name = $3,
    middle_name = $4,
    last_name = $5,
    date_of_birth = $6,
    gender = $7,
    form_level = $8,
    guardian_name = $9,
    guardian_phone = $10,
    guardian_alt_phone = $11,
    guardian_email = $12,
    guardian_relationship = $13,
    previous_school = $14,
    previous_school_id = $15,
    school_id = $16,
    academic_year_id = $17,
    disability = $18,
    disability_details = $19,
    status = $20,
    updated_at = NOW()
WHERE
    id = $1
    AND school_id = $21
RETURNING id,
    student_number,
    first_name,
    middle_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    guardian_phone,
    guardian_alt_phone,
    guardian_email,
    guardian_relationship,
    previous_school,
    previous_school_id,
    school_id,
    academic_year_id,
    disability,
    disability_details,
    status,
    created_at,
    updated_at;

-- name: DeleteStudentByIDAndSchoolID :exec
DELETE FROM
    students
WHERE
    id = $1
    AND school_id = $2;

-- name: CreateStudentSubjectAssignment :exec
INSERT INTO
    student_subjects (student_id, subject_id)
VALUES
    ($1, $2)
ON CONFLICT DO NOTHING;

-- name: DeleteStudentSubjectsByStudentID :exec
DELETE FROM
    student_subjects
WHERE
    student_id = $1;

-- name: ListStudentSubjectIDsByStudentID :many
SELECT
    student_id,
    subject_id
FROM
    student_subjects
WHERE
    student_id = $1;

-- name: GetSchoolDashboardStats :one
SELECT
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1) AS student_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.gender = 'Male') AS male_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.gender = 'Female') AS female_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.disability) AS disability_count,
    (SELECT COUNT(*) FROM transfers t WHERE t.to_school = $1) AS incoming_transfer_count,
    (SELECT COUNT(*) FROM transfers t WHERE t.from_school = $1) AS outgoing_transfer_count,
    (SELECT COUNT(*) FROM transfers t WHERE t.to_school = $1 AND t.status = 'Pending') AS pending_incoming_count,
    (SELECT COUNT(*) FROM transfers t WHERE t.from_school = $1 AND t.status = 'Pending') AS pending_outgoing_count,
    (SELECT COUNT(*) FROM exam_results e WHERE e.school_id = $1) AS exam_result_count;

-- name: GetStudentCountBySchoolID :one
SELECT COUNT(*) AS count
FROM students
WHERE school_id = $1;

-- name: GetIncomingTransferCountBySchoolID :one
SELECT COUNT(*) AS count
FROM transfers
WHERE to_school = $1;

-- name: GetOutgoingTransferCountBySchoolID :one
SELECT COUNT(*) AS count
FROM transfers
WHERE from_school = $1;

-- name: ListExamResultsBySchoolID :many
SELECT
    id,
    school_id,
    academic_year_id,
    jce_pass_rate,
    msce_pass_rate
FROM
    exam_results
WHERE
    school_id = $1
ORDER BY
    academic_year_id DESC;

-- name: GetExamResultBySchoolIDAndAcademicYear :one
SELECT
    id,
    school_id,
    academic_year_id,
    jce_pass_rate,
    msce_pass_rate
FROM
    exam_results
WHERE
    school_id = $1
    AND academic_year_id = $2;

-- name: CreateExamResult :one
INSERT INTO exam_results (
    school_id,
    academic_year_id,
    jce_pass_rate,
    msce_pass_rate
)
VALUES
    ($1, $2, $3, $4)
RETURNING id,
    school_id,
    academic_year_id,
    jce_pass_rate,
    msce_pass_rate;

-- name: UpdateExamResult :one
UPDATE exam_results
SET
    jce_pass_rate = $2,
    msce_pass_rate = $3
WHERE
    id = $1
RETURNING id,
    school_id,
    academic_year_id,
    jce_pass_rate,
    msce_pass_rate;

-- name: DeleteExamResult :exec
DELETE FROM exam_results
WHERE id = $1;

-- name: ListAcademicYears :many
SELECT
    id,
    year,
    start_date,
    end_date,
    status,
    created_at,
    updated_at
FROM
    academic_years
ORDER BY
    year DESC;

-- name: CreateAcademicYear :one
INSERT INTO 
    academic_years (year, start_date, end_date, status, created_at, updated_at)
VALUES 
    ($1, $2, $3, $4, NOW(), NOW()) RETURNING id,
    year,
    created_at,
    updated_at;

-- name: GetAcademicYearByID :one
SELECT
    id,
    year,
    start_date,
    end_date,
    status,
    created_at,
    updated_at
FROM
    academic_years
WHERE
    id = $1;
-- name: UpdateAcademicYear :one
UPDATE
    academic_years
SET
    year = $2,
    start_date = $3,
    end_date = $4,
    status = $5,
    updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    year,
    start_date,
    end_date,
    status,
    created_at,
    updated_at;
-- name: DeleteAcademicYear :exec
DELETE FROM
    academic_years
WHERE
    id = $1;


-- name: CreateTransferRequest :one
INSERT INTO transfers (
    student_id,
    from_school,
    to_school,
    status,
    date_initiated,
    reason
)
VALUES
    ($1, $2, $3, 'Pending', $4, $5)
RETURNING id;

-- name: CountPendingTransfersForStudent :one
SELECT COUNT(*) AS count
FROM transfers
WHERE student_id = $1 AND status = 'Pending';

-- name: GetTransfersByToSchoolID :many
SELECT
    t.id,
    t.student_id,
    t.from_school,
    t.to_school,
    t.status,
    t.date_initiated,
    t.date_accepted,
    t.reason,
    t.rejection_reason,
    s.student_number,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    fs.name AS from_school_name,
    ts.name AS to_school_name
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
WHERE
    t.to_school = $1
ORDER BY t.date_initiated DESC, t.id DESC;

-- name: GetOutgoingTransfers :many
SELECT
    t.id,
    t.student_id,
    t.from_school,
    t.to_school,
    t.status,
    t.date_initiated,
    t.date_accepted,
    t.reason,
    t.rejection_reason,
    s.student_number,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    fs.name AS from_school_name,
    ts.name AS to_school_name
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
WHERE
    t.from_school = $1
ORDER BY t.date_initiated DESC, t.id DESC;

-- name: GetTransferByID :one
SELECT
    t.id,
    t.student_id,
    t.from_school,
    t.to_school,
    t.status,
    t.date_initiated,
    t.date_accepted,
    t.reason,
    t.rejection_reason,
    s.student_number,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    fs.name AS from_school_name,
    ts.name AS to_school_name
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
WHERE
    t.id = $1;

-- Approval marks the transfer Accepted and moves the student in one statement.
-- The student is only moved when the transfer row actually matched (still Pending,
-- and owned by the receiving school when school_id is given).

-- name: ApproveTransfer :one
WITH approved AS (
    UPDATE transfers
    SET
        status = 'Accepted',
        date_accepted = CURRENT_TIMESTAMP
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.status = 'Pending'
    RETURNING transfers.id, transfers.student_id, transfers.to_school
),
moved AS (
    UPDATE students
    SET school_id = approved.to_school, updated_at = CURRENT_TIMESTAMP
    FROM approved
    WHERE students.id = approved.student_id
    RETURNING students.id
)
SELECT approved.id FROM approved;

-- name: ApproveTransferForSchool :one
WITH approved AS (
    UPDATE transfers
    SET
        status = 'Accepted',
        date_accepted = CURRENT_TIMESTAMP
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.to_school = sqlc.arg(school_id)
        AND transfers.status = 'Pending'
    RETURNING transfers.id, transfers.student_id, transfers.to_school
),
moved AS (
    UPDATE students
    SET school_id = approved.to_school, updated_at = CURRENT_TIMESTAMP
    FROM approved
    WHERE students.id = approved.student_id
    RETURNING students.id
)
SELECT approved.id FROM approved;

-- name: FinalizeTransfer :one
UPDATE transfers
SET status = 'Completed'
WHERE
    id = $1
    AND status = 'Accepted'
RETURNING id;

-- name: FinalizeTransferForSchool :one
UPDATE transfers
SET status = 'Completed'
WHERE
    id = sqlc.arg(transfer_id)
    AND from_school = sqlc.arg(school_id)
    AND status = 'Accepted'
RETURNING id;

-- name: RejectTransfer :one
UPDATE transfers
SET
    status = 'Rejected',
    rejection_reason = sqlc.arg(rejection_reason)
WHERE
    id = sqlc.arg(transfer_id)
    AND status = 'Pending'
RETURNING id;

-- name: RejectTransferForSchool :one
UPDATE transfers
SET
    status = 'Rejected',
    rejection_reason = sqlc.arg(rejection_reason)
WHERE
    id = sqlc.arg(transfer_id)
    AND to_school = sqlc.arg(school_id)
    AND status = 'Pending'
RETURNING id;

-- name: CreateSubject :one
INSERT INTO
    subjects (code, name, description)
VALUES
    ($1, $2, $3) RETURNING id,
    code,
    name,
    description,
    created_at,
    updated_at;

-- name: ListSubjects :many
SELECT
    id,
    code,
    name,
    description,
    created_at,
    updated_at
FROM
    subjects
ORDER BY
    name;

-- name: GetSubjectByID :one
SELECT
    id,
    code,
    name,
    description,
    created_at,
    updated_at
FROM
    subjects
WHERE
    id = $1;

-- name: UpdateSubject :one
UPDATE
    subjects
SET
    code = $2,
    name = $3,
    description = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE
    id = $1 RETURNING id,
    code,
    name,
    description,
    created_at,
    updated_at;

-- name: DeleteSubject :exec
DELETE FROM
    subjects
WHERE
    id = $1;
-- name: GetSchoolReport :many
-- One row per school for the admin reports page. Region and district filters are
-- optional; pass rates come from the given academic year and are NULL when not recorded.
SELECT
    sc.id,
    sc.name,
    sc.school_number,
    d.id AS district_id,
    d.name AS district_name,
    r.id AS region_id,
    r.name AS region_name,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sc.id) AS student_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sc.id AND s.gender = 'Male') AS male_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sc.id AND s.gender = 'Female') AS female_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sc.id AND s.disability) AS disability_count,
    (SELECT COUNT(*) FROM transfers t WHERE t.to_school = sc.id) AS transfers_in,
    (SELECT COUNT(*) FROM transfers t WHERE t.from_school = sc.id) AS transfers_out,
    (SELECT COUNT(*) FROM transfers t WHERE t.to_school = sc.id AND t.status = 'Pending') AS pending_in,
    e.jce_pass_rate,
    e.msce_pass_rate
FROM
    schools sc
    JOIN districts d ON d.id = sc.district_id
    JOIN regions r ON r.id = d.region_id
    LEFT JOIN exam_results e ON e.school_id = sc.id
        AND e.academic_year_id = sqlc.narg(academic_year_id)::int
WHERE
    (sqlc.narg(region_id)::int IS NULL OR r.id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(district_id)::int IS NULL OR d.id = sqlc.narg(district_id)::int)
ORDER BY r.name, d.name, sc.name;

-- name: GetRegionDashboardStats :one
-- Headline counts for a regional admin's dashboard.
WITH region_schools AS (
    SELECT sc.id
    FROM schools sc
    JOIN districts d ON d.id = sc.district_id
    WHERE d.region_id = $1
)
SELECT
    (SELECT COUNT(*) FROM districts d WHERE d.region_id = $1) AS district_count,
    (SELECT COUNT(*) FROM region_schools) AS school_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools)) AS student_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.gender = 'Male') AS male_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.gender = 'Female') AS female_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.disability) AS disability_count,
    (SELECT COUNT(*) FROM transfers t
        WHERE t.status = 'Pending'
        AND (t.from_school IN (SELECT id FROM region_schools) OR t.to_school IN (SELECT id FROM region_schools))
    ) AS pending_transfer_count;

-- name: GetRegionDistrictSummary :many
-- Districts in a region with their school and student counts.
SELECT
    d.id,
    d.name,
    (SELECT COUNT(*) FROM schools sc WHERE sc.district_id = d.id) AS school_count,
    (SELECT COUNT(*) FROM students s JOIN schools sc ON sc.id = s.school_id WHERE sc.district_id = d.id) AS student_count
FROM districts d
WHERE d.region_id = $1
ORDER BY d.name;

-- name: ListStudentsForRegion :many
-- Students enrolled at schools in a region; district and school filters are optional.
SELECT
    s.id,
    s.student_number,
    s.first_name,
    s.last_name,
    s.gender,
    s.form_level,
    s.status,
    sc.id AS school_id,
    sc.name AS school_name,
    d.id AS district_id,
    d.name AS district_name
FROM students s
JOIN schools sc ON sc.id = s.school_id
JOIN districts d ON d.id = sc.district_id
WHERE
    d.region_id = sqlc.arg(region_id)
    AND (sqlc.narg(district_id)::int IS NULL OR d.id = sqlc.narg(district_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR sc.id = sqlc.narg(school_id)::int)
ORDER BY d.name, sc.name, s.last_name, s.first_name;

-- name: ListTransfersForRegion :many
-- Transfers into or out of any school in a region.
SELECT
    t.id,
    t.student_id,
    t.from_school,
    t.to_school,
    t.status,
    t.date_initiated,
    t.date_accepted,
    t.reason,
    t.rejection_reason,
    s.student_number,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    fs.name AS from_school_name,
    ts.name AS to_school_name
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
    JOIN districts fd ON fd.id = fs.district_id
    JOIN districts td ON td.id = ts.district_id
WHERE
    fd.region_id = $1 OR td.region_id = $1
ORDER BY t.date_initiated DESC, t.id DESC;

-- name: ListMarksForSchool :many
-- Marks of the school's current students. Year, term and student filters are optional.
SELECT
    m.id,
    m.student_id,
    m.subject_id,
    m.academic_year_id,
    m.term,
    m.mark,
    m.school_id,
    m.updated_at
FROM student_marks m
JOIN students s ON s.id = m.student_id
WHERE
    s.school_id = sqlc.arg(school_id)
    AND (sqlc.narg(academic_year_id)::int IS NULL OR m.academic_year_id = sqlc.narg(academic_year_id)::int)
    AND (sqlc.narg(term)::int IS NULL OR m.term = sqlc.narg(term)::int)
    AND (sqlc.narg(student_id)::int IS NULL OR m.student_id = sqlc.narg(student_id)::int)
ORDER BY m.student_id, m.subject_id, m.academic_year_id, m.term;

-- name: ListSubjectEnrolmentsForSchool :many
-- (student, subject) pairs for the given students, limited to the school's own students.
SELECT ss.student_id, ss.subject_id
FROM student_subjects ss
JOIN students s ON s.id = ss.student_id
WHERE s.school_id = sqlc.arg(school_id)
    AND ss.student_id = ANY(sqlc.arg(student_ids)::int[]);

-- name: UpsertMarks :exec
-- Saves a batch of marks for one academic year and term; the arrays are parallel.
INSERT INTO student_marks (student_id, subject_id, academic_year_id, term, mark, school_id, recorded_by)
SELECT
    unnest(sqlc.arg(student_ids)::int[]),
    unnest(sqlc.arg(subject_ids)::int[]),
    sqlc.arg(academic_year_id)::int,
    sqlc.arg(term)::int,
    unnest(sqlc.arg(marks)::int[]),
    sqlc.arg(school_id)::int,
    sqlc.narg(recorded_by)::int
ON CONFLICT (student_id, subject_id, academic_year_id, term) DO UPDATE
SET
    mark = EXCLUDED.mark,
    school_id = EXCLUDED.school_id,
    recorded_by = EXCLUDED.recorded_by,
    updated_at = CURRENT_TIMESTAMP;

-- name: DeleteMarks :exec
-- Removes the marks for the given (student, subject) pairs in one academic year and term.
DELETE FROM student_marks m
USING (
    SELECT unnest(sqlc.arg(student_ids)::int[]) AS student_id, unnest(sqlc.arg(subject_ids)::int[]) AS subject_id
) AS cleared
WHERE m.student_id = cleared.student_id
    AND m.subject_id = cleared.subject_id
    AND m.academic_year_id = sqlc.arg(academic_year_id)::int
    AND m.term = sqlc.arg(term)::int;
