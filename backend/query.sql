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
    last_login_at,
    must_change_password
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


-- Every transfer action (create, approve, finalize, reject) also writes its audit_logs row in the same statement,
-- so a status change is never saved without its audit entry (or the reverse).
-- The actor's name, role and school are copied from users at the time of the action.

-- name: CreateTransferRequest :one
WITH created AS (
    INSERT INTO transfers (
        student_id,
        from_school,
        to_school,
        status,
        date_initiated,
        reason
    )
    VALUES
        (sqlc.arg(student_id), sqlc.arg(from_school), sqlc.arg(to_school), 'Pending', sqlc.arg(date_initiated), sqlc.arg(reason))
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', created.id, 'Created', u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
    FROM created LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT created.id FROM created;

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
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', approved.id, 'Approved', u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
    FROM approved LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
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
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', approved.id, 'Approved', u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
    FROM approved LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT approved.id FROM approved;

-- name: FinalizeTransfer :one
WITH finalized AS (
    UPDATE transfers
    SET status = 'Completed'
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.status = 'Accepted'
    RETURNING transfers.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', finalized.id, 'Completed', u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
    FROM finalized LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT finalized.id FROM finalized;

-- name: FinalizeTransferForSchool :one
WITH finalized AS (
    UPDATE transfers
    SET status = 'Completed'
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.from_school = sqlc.arg(school_id)
        AND transfers.status = 'Accepted'
    RETURNING transfers.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', finalized.id, 'Completed', u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
    FROM finalized LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT finalized.id FROM finalized;

-- name: RejectTransfer :one
WITH rejected AS (
    UPDATE transfers
    SET
        status = 'Rejected',
        rejection_reason = sqlc.arg(rejection_reason)
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.status = 'Pending'
    RETURNING transfers.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', rejected.id, 'Rejected', u.id, u.name, u.role, u.school_id, sqlc.arg(rejection_reason)::text
    FROM rejected LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT rejected.id FROM rejected;

-- name: RejectTransferForSchool :one
WITH rejected AS (
    UPDATE transfers
    SET
        status = 'Rejected',
        rejection_reason = sqlc.arg(rejection_reason)
    WHERE
        transfers.id = sqlc.arg(transfer_id)
        AND transfers.to_school = sqlc.arg(school_id)
        AND transfers.status = 'Pending'
    RETURNING transfers.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', rejected.id, 'Rejected', u.id, u.name, u.role, u.school_id, sqlc.arg(rejection_reason)::text
    FROM rejected LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT rejected.id FROM rejected;

-- Transfer history for the super admin. Every filter is optional; a school, district
-- or region matches when it is on either side of the transfer. date_from/date_to are
-- inclusive days on date_initiated. row_limit NULL returns every row (used by the export).
-- decision is the latest Approved or Rejected entry; completed is the Completed entry.

-- name: ListTransfersForAdmin :many
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
    ts.name AS to_school_name,
    fd.name AS from_district_name,
    td.name AS to_district_name,
    fr.name AS from_region_name,
    tr.name AS to_region_name,
    decision.action AS decision_action,
    decision.actor_name AS decision_actor_name,
    decision.actor_role AS decision_actor_role,
    decision.note AS decision_note,
    decision.created_at AS decision_at,
    completed.actor_name AS completed_actor_name,
    completed.actor_role AS completed_actor_role,
    completed.created_at AS completed_at,
    COUNT(*) OVER () AS total_count
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
    JOIN districts fd ON fd.id = fs.district_id
    JOIN districts td ON td.id = ts.district_id
    JOIN regions fr ON fr.id = fd.region_id
    JOIN regions tr ON tr.id = td.region_id
    LEFT JOIN audit_logs decision ON decision.id = (
        SELECT a.id
        FROM audit_logs a
        WHERE a.entity_type = 'transfer' AND a.entity_id = t.id AND a.action IN ('Approved', 'Rejected')
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT 1
    )
    LEFT JOIN audit_logs completed ON completed.id = (
        SELECT a.id
        FROM audit_logs a
        WHERE a.entity_type = 'transfer' AND a.entity_id = t.id AND a.action = 'Completed'
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT 1
    )
WHERE
    (sqlc.narg(status)::text IS NULL OR t.status = sqlc.narg(status)::text)
    AND (sqlc.narg(region_id)::int IS NULL OR fd.region_id = sqlc.narg(region_id)::int OR td.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(district_id)::int IS NULL OR fs.district_id = sqlc.narg(district_id)::int OR ts.district_id = sqlc.narg(district_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR t.from_school = sqlc.narg(school_id)::int OR t.to_school = sqlc.narg(school_id)::int)
    AND (sqlc.narg(date_from)::date IS NULL OR t.date_initiated >= sqlc.narg(date_from)::date)
    AND (sqlc.narg(date_to)::date IS NULL OR t.date_initiated < sqlc.narg(date_to)::date + 1)
    AND (
        sqlc.narg(search)::text IS NULL
        OR s.student_number ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.first_name || ' ' || s.last_name) ILIKE '%' || sqlc.narg(search)::text || '%'
    )
ORDER BY t.date_initiated DESC, t.id DESC
LIMIT sqlc.narg(row_limit)::int
OFFSET sqlc.arg(row_offset)::int;

-- Per-status totals for the same filters as ListTransfersForAdmin, minus status.

-- name: CountTransfersByStatusForAdmin :many
SELECT t.status, COUNT(*) AS count
FROM
    transfers t
    JOIN students s ON s.id = t.student_id
    JOIN schools fs ON fs.id = t.from_school
    JOIN schools ts ON ts.id = t.to_school
    JOIN districts fd ON fd.id = fs.district_id
    JOIN districts td ON td.id = ts.district_id
WHERE
    (sqlc.narg(region_id)::int IS NULL OR fd.region_id = sqlc.narg(region_id)::int OR td.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(district_id)::int IS NULL OR fs.district_id = sqlc.narg(district_id)::int OR ts.district_id = sqlc.narg(district_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR t.from_school = sqlc.narg(school_id)::int OR t.to_school = sqlc.narg(school_id)::int)
    AND (sqlc.narg(date_from)::date IS NULL OR t.date_initiated >= sqlc.narg(date_from)::date)
    AND (sqlc.narg(date_to)::date IS NULL OR t.date_initiated < sqlc.narg(date_to)::date + 1)
    AND (
        sqlc.narg(search)::text IS NULL
        OR s.student_number ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.first_name || ' ' || s.last_name) ILIKE '%' || sqlc.narg(search)::text || '%'
    )
GROUP BY t.status;

-- name: ListAuditLogsForEntity :many
SELECT
    a.id,
    a.action,
    a.actor_user_id,
    a.actor_name,
    a.actor_role,
    sc.name AS actor_school_name,
    a.note,
    a.created_at
FROM
    audit_logs a
    LEFT JOIN schools sc ON sc.id = a.actor_school_id
WHERE
    a.entity_type = sqlc.arg(entity_type)
    AND a.entity_id = sqlc.arg(entity_id)
ORDER BY a.created_at, a.id;

-- name: CreateAuditLog :exec
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT sqlc.arg(entity_type), sqlc.narg(entity_id)::int, sqlc.arg(action), u.id, u.name, u.role, u.school_id, sqlc.narg(note)::text
FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

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

-- ============================================================================
-- Communications: notices (one-way, many recipients) and conversations (two-party).
-- A party is 'SUPER_ADMIN' (id 0), 'REGION' (regions.id) or 'SCHOOL' (schools.id).
-- Recipients of a notice are chosen by audience_type:
--   REGIONAL_ADMINS, REGIONAL_ADMIN (audience_id = region), SCHOOLS_ALL,
--   SCHOOLS_IN_REGION (region), SCHOOLS_IN_DISTRICT (district), SCHOOL (school).
-- ============================================================================

-- name: CountNoticeAudience :one
SELECT (
    (SELECT COUNT(*) FROM regions rg
     WHERE sqlc.arg(audience_type)::text = 'REGIONAL_ADMINS'
        OR (sqlc.arg(audience_type)::text = 'REGIONAL_ADMIN' AND rg.id = sqlc.narg(audience_id)::int))
    +
    (SELECT COUNT(*) FROM schools sc JOIN districts d ON d.id = sc.district_id
     WHERE sqlc.arg(audience_type)::text = 'SCHOOLS_ALL'
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_REGION' AND d.region_id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_DISTRICT' AND d.id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOL' AND sc.id = sqlc.narg(audience_id)::int))
)::int AS count;

-- Sends a notice: the notice, one recipient row per region or school in the audience,
-- and the audit entry, all in one statement.

-- name: CreateNotice :one
WITH n AS (
    INSERT INTO notices (
        kind, sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id,
        title, body, priority, due_date, audience_type, audience_id
    )
    SELECT
        'NOTICE', u.id, u.name, u.role, sqlc.arg(sender_party_type)::text, sqlc.arg(sender_party_id)::int,
        sqlc.arg(title)::text, sqlc.arg(body)::text, sqlc.arg(priority)::text, sqlc.narg(due_date)::date,
        sqlc.arg(audience_type)::text, sqlc.narg(audience_id)::int
    FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
    RETURNING id
),
audience AS (
    SELECT 'REGION'::text AS party_type, rg.id AS party_id
    FROM regions rg
    WHERE sqlc.arg(audience_type)::text = 'REGIONAL_ADMINS'
        OR (sqlc.arg(audience_type)::text = 'REGIONAL_ADMIN' AND rg.id = sqlc.narg(audience_id)::int)
    UNION ALL
    SELECT 'SCHOOL'::text, sc.id
    FROM schools sc JOIN districts d ON d.id = sc.district_id
    WHERE sqlc.arg(audience_type)::text = 'SCHOOLS_ALL'
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_REGION' AND d.region_id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_DISTRICT' AND d.id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOL' AND sc.id = sqlc.narg(audience_id)::int)
),
recipients AS (
    INSERT INTO notice_recipients (notice_id, party_type, party_id)
    SELECT n.id, audience.party_type, audience.party_id FROM n CROSS JOIN audience
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'notice', n.id, 'Sent', u.id, u.name, u.role, u.school_id, sqlc.arg(title)::text
    FROM n LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
)
SELECT n.id, (SELECT COUNT(*) FROM recipients)::int AS recipient_count FROM n;

-- name: GetNoticeForSender :one
SELECT id, title, due_date, withdrawn_at
FROM notices
WHERE id = sqlc.arg(notice_id)
    AND kind = 'NOTICE'
    AND sender_party_type = sqlc.arg(sender_party_type)
    AND sender_party_id = sqlc.arg(sender_party_id);

-- Sends the notice again to the recipients who have not acted on it: not marked done
-- when it has a due date, otherwise not read. Returns no row when nobody is pending.

-- name: CreateReminderNotice :one
WITH original AS (
    SELECT * FROM notices
    WHERE notices.id = sqlc.arg(notice_id) AND notices.kind = 'NOTICE' AND notices.withdrawn_at IS NULL
),
pending AS (
    SELECT r.party_type, r.party_id
    FROM notice_recipients r JOIN original o ON o.id = r.notice_id
    WHERE (o.due_date IS NOT NULL AND r.done_at IS NULL) OR (o.due_date IS NULL AND r.read_at IS NULL)
),
n AS (
    INSERT INTO notices (
        kind, sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id,
        title, body, priority, due_date, audience_type, reminder_of
    )
    SELECT
        'NOTICE', u.id, u.name, u.role, o.sender_party_type, o.sender_party_id,
        CASE WHEN o.title LIKE 'Reminder: %' THEN o.title ELSE 'Reminder: ' || o.title END,
        o.body, o.priority, o.due_date, 'PENDING_RECIPIENTS', COALESCE(o.reminder_of, o.id)
    FROM original o LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
    WHERE EXISTS (SELECT 1 FROM pending)
    RETURNING id
),
recipients AS (
    INSERT INTO notice_recipients (notice_id, party_type, party_id)
    SELECT n.id, pending.party_type, pending.party_id FROM n CROSS JOIN pending
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'notice', n.id, 'Reminded', u.id, u.name, u.role, u.school_id, 'Reminder of notice ' || sqlc.arg(notice_id)::int
    FROM n LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
)
SELECT n.id, (SELECT COUNT(*) FROM recipients)::int AS recipient_count FROM n;

-- name: WithdrawNotice :one
WITH withdrawn AS (
    UPDATE notices
    SET withdrawn_at = CURRENT_TIMESTAMP, withdrawn_reason = sqlc.arg(reason)::text
    WHERE notices.id = sqlc.arg(notice_id)
        AND notices.kind = 'NOTICE'
        AND notices.sender_party_type = sqlc.arg(sender_party_type)::text
        AND notices.sender_party_id = sqlc.arg(sender_party_id)::int
        AND notices.withdrawn_at IS NULL
    RETURNING notices.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'notice', withdrawn.id, 'Withdrawn', u.id, u.name, u.role, u.school_id, sqlc.arg(reason)::text
    FROM withdrawn LEFT JOIN users u ON u.id = sqlc.arg(user_id)::int
)
SELECT withdrawn.id FROM withdrawn;

-- An automatic notice to one school, e.g. about a transfer.

-- name: CreateSystemNotice :exec
WITH n AS (
    INSERT INTO notices (kind, sender_party_type, sender_party_id, title, body, audience_type, audience_id)
    VALUES ('SYSTEM', 'SYSTEM', 0, sqlc.arg(title)::text, sqlc.arg(body)::text, 'SCHOOL', sqlc.arg(school_id)::int)
    RETURNING id
)
INSERT INTO notice_recipients (notice_id, party_type, party_id)
SELECT n.id, 'SCHOOL', sqlc.arg(school_id)::int FROM n;

-- name: ListNoticeInbox :many
SELECT
    n.id,
    n.kind,
    n.title,
    n.body,
    n.priority,
    n.due_date,
    n.sender_name,
    COALESCE(CASE n.sender_party_type
        WHEN 'SUPER_ADMIN' THEN 'Ministry Headquarters'
        WHEN 'REGION' THEN rg.name || ' Regional Office'
        WHEN 'SYSTEM' THEN 'NSMS (automatic)'
    END, 'Unknown')::text AS sender_label,
    n.created_at,
    n.withdrawn_at,
    n.withdrawn_reason,
    r.read_at,
    r.done_at,
    du.name AS done_by_name
FROM
    notice_recipients r
    JOIN notices n ON n.id = r.notice_id
    LEFT JOIN regions rg ON n.sender_party_type = 'REGION' AND rg.id = n.sender_party_id
    LEFT JOIN users du ON du.id = r.done_by_user_id
WHERE r.party_type = sqlc.arg(party_type) AND r.party_id = sqlc.arg(party_id)
ORDER BY n.created_at DESC, n.id DESC
LIMIT 200;

-- name: ListSentNotices :many
SELECT
    n.id,
    n.title,
    n.body,
    n.priority,
    n.due_date,
    n.audience_type,
    COALESCE(CASE n.audience_type
        WHEN 'REGIONAL_ADMINS' THEN 'All regional admins'
        WHEN 'REGIONAL_ADMIN' THEN ar.name || ' regional admin'
        WHEN 'SCHOOLS_ALL' THEN 'All schools'
        WHEN 'SCHOOLS_IN_REGION' THEN 'All schools in ' || ar.name || ' region'
        WHEN 'SCHOOLS_IN_DISTRICT' THEN 'All schools in ' || ad.name || ' district'
        WHEN 'SCHOOL' THEN asch.name
        WHEN 'PENDING_RECIPIENTS' THEN 'Recipients still pending'
    END, 'Unknown')::text AS audience_label,
    n.sender_name,
    n.created_at,
    n.withdrawn_at,
    n.withdrawn_reason,
    n.reminder_of,
    (SELECT COUNT(*) FROM notice_recipients r WHERE r.notice_id = n.id) AS recipient_count,
    (SELECT COUNT(*) FROM notice_recipients r WHERE r.notice_id = n.id AND r.read_at IS NOT NULL) AS read_count,
    (SELECT COUNT(*) FROM notice_recipients r WHERE r.notice_id = n.id AND r.done_at IS NOT NULL) AS done_count
FROM
    notices n
    LEFT JOIN regions ar ON n.audience_type IN ('REGIONAL_ADMIN', 'SCHOOLS_IN_REGION') AND ar.id = n.audience_id
    LEFT JOIN districts ad ON n.audience_type = 'SCHOOLS_IN_DISTRICT' AND ad.id = n.audience_id
    LEFT JOIN schools asch ON n.audience_type = 'SCHOOL' AND asch.id = n.audience_id
WHERE
    n.kind = 'NOTICE'
    AND n.sender_party_type = sqlc.arg(sender_party_type)
    AND n.sender_party_id = sqlc.arg(sender_party_id)
ORDER BY n.created_at DESC, n.id DESC
LIMIT 200;

-- name: ListNoticeRecipients :many
SELECT
    r.party_type,
    r.party_id,
    COALESCE(CASE r.party_type
        WHEN 'REGION' THEN rg.name || ' Regional Office'
        WHEN 'SCHOOL' THEN sc.name
    END, 'Unknown')::text AS label,
    COALESCE(d.name, '')::text AS district_name,
    r.read_at,
    r.done_at,
    du.name AS done_by_name
FROM
    notice_recipients r
    LEFT JOIN regions rg ON r.party_type = 'REGION' AND rg.id = r.party_id
    LEFT JOIN schools sc ON r.party_type = 'SCHOOL' AND sc.id = r.party_id
    LEFT JOIN districts d ON d.id = sc.district_id
    LEFT JOIN users du ON du.id = r.done_by_user_id
WHERE r.notice_id = sqlc.arg(notice_id)
ORDER BY label;

-- name: MarkNoticeRead :one
UPDATE notice_recipients
SET
    read_at = COALESCE(read_at, CURRENT_TIMESTAMP),
    read_by_user_id = COALESCE(read_by_user_id, NULLIF(sqlc.arg(user_id)::int, 0))
WHERE notice_id = sqlc.arg(notice_id) AND party_type = sqlc.arg(party_type) AND party_id = sqlc.arg(party_id)
RETURNING id;

-- name: MarkNoticeDone :one
UPDATE notice_recipients
SET
    done_at = COALESCE(notice_recipients.done_at, CURRENT_TIMESTAMP),
    done_by_user_id = COALESCE(notice_recipients.done_by_user_id, NULLIF(sqlc.arg(user_id)::int, 0)),
    read_at = COALESCE(notice_recipients.read_at, CURRENT_TIMESTAMP),
    read_by_user_id = COALESCE(notice_recipients.read_by_user_id, NULLIF(sqlc.arg(user_id)::int, 0))
FROM notices n
WHERE
    n.id = notice_recipients.notice_id
    AND n.withdrawn_at IS NULL
    AND notice_recipients.notice_id = sqlc.arg(notice_id)
    AND notice_recipients.party_type = sqlc.arg(party_type)
    AND notice_recipients.party_id = sqlc.arg(party_id)
RETURNING notice_recipients.id;

-- name: GetCommsSummary :one
SELECT
    (SELECT COUNT(*) FROM notice_recipients r JOIN notices n ON n.id = r.notice_id
     WHERE r.party_type = sqlc.arg(party_type)::text AND r.party_id = sqlc.arg(party_id)::int
        AND r.read_at IS NULL AND n.withdrawn_at IS NULL) AS unread_notices,
    (SELECT COUNT(*) FROM notice_recipients r JOIN notices n ON n.id = r.notice_id
     WHERE r.party_type = sqlc.arg(party_type)::text AND r.party_id = sqlc.arg(party_id)::int
        AND n.due_date IS NOT NULL AND r.done_at IS NULL AND n.withdrawn_at IS NULL) AS open_tasks,
    (SELECT COUNT(*) FROM conversation_participants p
     WHERE p.party_type = sqlc.arg(party_type)::text AND p.party_id = sqlc.arg(party_id)::int
        AND EXISTS (
            SELECT 1 FROM messages m
            WHERE m.conversation_id = p.conversation_id
                AND NOT (m.sender_party_type = p.party_type AND m.sender_party_id = p.party_id)
                AND m.created_at > COALESCE(p.last_read_at, '-infinity'::timestamp)
        )) AS unread_conversations;

-- name: CountRecentNoticesByUser :one
SELECT COUNT(*) FROM notices
WHERE sender_user_id = sqlc.arg(user_id) AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- name: CountRecentConversationsByUser :one
SELECT COUNT(*) FROM conversations
WHERE created_by_user_id = sqlc.arg(user_id) AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- name: CountRecentMessagesByUser :one
SELECT COUNT(*) FROM messages
WHERE sender_user_id = sqlc.arg(user_id) AND created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- Starts a conversation: the thread, both participants and the first message.
-- The sender has read their own message, so only the other party sees it as unread.

-- name: CreateConversation :one
WITH c AS (
    INSERT INTO conversations (subject, created_by_user_id)
    VALUES (sqlc.arg(subject)::text, NULLIF(sqlc.arg(sender_user_id)::int, 0))
    RETURNING id, created_at
),
parts AS (
    INSERT INTO conversation_participants (conversation_id, party_type, party_id, last_read_at)
    SELECT c.id, sqlc.arg(from_party_type)::text, sqlc.arg(from_party_id)::int, c.created_at FROM c
    UNION ALL
    SELECT c.id, sqlc.arg(to_party_type)::text, sqlc.arg(to_party_id)::int, NULL::timestamp FROM c
    RETURNING 1
),
first_message AS (
    INSERT INTO messages (conversation_id, sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id, body, created_at)
    SELECT c.id, u.id, u.name, u.role, sqlc.arg(from_party_type)::text, sqlc.arg(from_party_id)::int, sqlc.arg(body)::text, c.created_at
    FROM c LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
    RETURNING 1
)
SELECT c.id FROM c;

-- name: ListConversationsForParty :many
SELECT
    c.id,
    c.subject,
    c.last_message_at,
    c.reported_at,
    other.party_type AS other_party_type,
    other.party_id AS other_party_id,
    COALESCE(CASE other.party_type
        WHEN 'SUPER_ADMIN' THEN 'Ministry Headquarters'
        WHEN 'REGION' THEN rg.name || ' Regional Office'
        WHEN 'SCHOOL' THEN sc.name
    END, 'Unknown')::text AS other_label,
    lm.body AS last_body,
    lm.sender_name AS last_sender_name,
    COALESCE(lm.sender_party_type = me.party_type AND lm.sender_party_id = me.party_id, FALSE)::bool AS last_from_me,
    EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = c.id
            AND NOT (m.sender_party_type = me.party_type AND m.sender_party_id = me.party_id)
            AND m.created_at > COALESCE(me.last_read_at, '-infinity'::timestamp)
    ) AS unread
FROM
    conversation_participants me
    JOIN conversations c ON c.id = me.conversation_id
    JOIN conversation_participants other
        ON other.conversation_id = c.id AND NOT (other.party_type = me.party_type AND other.party_id = me.party_id)
    LEFT JOIN regions rg ON other.party_type = 'REGION' AND rg.id = other.party_id
    LEFT JOIN schools sc ON other.party_type = 'SCHOOL' AND sc.id = other.party_id
    LEFT JOIN messages lm ON lm.id = (
        SELECT m.id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1
    )
WHERE me.party_type = sqlc.arg(party_type) AND me.party_id = sqlc.arg(party_id)
ORDER BY c.last_message_at DESC, c.id DESC
LIMIT 200;

-- name: ListReportedConversations :many
SELECT
    c.id,
    c.subject,
    c.last_message_at,
    c.reported_at,
    c.reported_by_name,
    c.report_reason
FROM conversations c
WHERE c.reported_at IS NOT NULL
ORDER BY c.reported_at DESC, c.id DESC
LIMIT 200;

-- name: GetConversation :one
SELECT id, subject, created_at, last_message_at, reported_at, reported_by_name, report_reason
FROM conversations
WHERE id = sqlc.arg(conversation_id);

-- name: ListConversationParticipants :many
SELECT
    p.conversation_id,
    p.party_type,
    p.party_id,
    COALESCE(CASE p.party_type
        WHEN 'SUPER_ADMIN' THEN 'Ministry Headquarters'
        WHEN 'REGION' THEN rg.name || ' Regional Office'
        WHEN 'SCHOOL' THEN sc.name
    END, 'Unknown')::text AS label
FROM
    conversation_participants p
    LEFT JOIN regions rg ON p.party_type = 'REGION' AND rg.id = p.party_id
    LEFT JOIN schools sc ON p.party_type = 'SCHOOL' AND sc.id = p.party_id
WHERE p.conversation_id = ANY(sqlc.arg(conversation_ids)::int[])
ORDER BY p.conversation_id, p.party_type, p.party_id;

-- name: ListMessages :many
SELECT id, sender_name, sender_role, sender_party_type, sender_party_id, body, created_at
FROM messages
WHERE conversation_id = sqlc.arg(conversation_id)
ORDER BY created_at, id;

-- name: MarkConversationRead :exec
UPDATE conversation_participants
SET last_read_at = CURRENT_TIMESTAMP
WHERE conversation_id = sqlc.arg(conversation_id) AND party_type = sqlc.arg(party_type) AND party_id = sqlc.arg(party_id);

-- name: CreateMessage :one
WITH m AS (
    INSERT INTO messages (conversation_id, sender_user_id, sender_name, sender_role, sender_party_type, sender_party_id, body)
    SELECT sqlc.arg(conversation_id)::int, u.id, u.name, u.role, sqlc.arg(party_type)::text, sqlc.arg(party_id)::int, sqlc.arg(body)::text
    FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(sender_user_id)::int
    RETURNING id, conversation_id, created_at
),
touched AS (
    UPDATE conversations SET last_message_at = m.created_at
    FROM m WHERE conversations.id = m.conversation_id
    RETURNING conversations.id
),
seen AS (
    UPDATE conversation_participants SET last_read_at = m.created_at
    FROM m
    WHERE conversation_participants.conversation_id = m.conversation_id
        AND conversation_participants.party_type = sqlc.arg(party_type)::text
        AND conversation_participants.party_id = sqlc.arg(party_id)::int
    RETURNING conversation_participants.conversation_id
)
SELECT m.id FROM m;

-- name: ReportConversation :one
WITH reported AS (
    UPDATE conversations
    SET
        reported_at = CURRENT_TIMESTAMP,
        reported_by_user_id = NULLIF(sqlc.arg(user_id)::int, 0),
        reported_by_name = (SELECT u.name FROM users u WHERE u.id = sqlc.arg(user_id)::int),
        report_reason = sqlc.arg(reason)::text
    WHERE conversations.id = sqlc.arg(conversation_id) AND conversations.reported_at IS NULL
    RETURNING conversations.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'conversation', reported.id, 'Reported', u.id, u.name, u.role, u.school_id, sqlc.arg(reason)::text
    FROM reported LEFT JOIN users u ON u.id = sqlc.arg(user_id)::int
)
SELECT reported.id FROM reported;

-- name: ListContactSchools :many
SELECT sc.id, sc.name, d.name AS district_name, d.region_id, rg.name AS region_name
FROM schools sc
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
ORDER BY rg.name, d.name, sc.name;

-- name: ListContactRegions :many
SELECT id, name FROM regions ORDER BY name;

-- name: GetSchoolRegionID :one
SELECT d.region_id FROM schools sc JOIN districts d ON d.id = sc.district_id WHERE sc.id = sqlc.arg(school_id);

-- name: GetDistrictRegionID :one
SELECT region_id FROM districts WHERE id = sqlc.arg(district_id);

-- ============================================================================
-- Accounts and contacts. Account changes write an audit_logs row (entity 'user')
-- in the same statement; office edits do the same for 'region' and 'school'.
-- ============================================================================

-- Checked on every authenticated request, so a deactivated account stops working at
-- once and a temporary password must be changed before anything else.

-- name: GetAuthUserState :one
SELECT
    (COALESCE(is_activated, FALSE) AND deleted_at IS NULL)::bool AS active,
    must_change_password
FROM users
WHERE id = sqlc.arg(user_id);

-- name: RecordLogin :exec
UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = sqlc.arg(user_id);

-- name: GetUserPassword :one
SELECT password FROM users WHERE id = sqlc.arg(user_id) AND deleted_at IS NULL;

-- name: ChangeOwnPassword :exec
WITH changed AS (
    UPDATE users
    SET password = sqlc.arg(password_hash)::text, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE users.id = sqlc.arg(user_id)
    RETURNING users.id, users.name, users.role, users.school_id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
SELECT 'user', changed.id, 'PasswordChanged', changed.id, changed.name, changed.role, changed.school_id FROM changed;

-- name: UpdateOwnContact :one
UPDATE users
SET phone = sqlc.narg(phone), whatsapp = sqlc.narg(whatsapp), updated_at = CURRENT_TIMESTAMP
WHERE id = sqlc.arg(user_id) AND deleted_at IS NULL
RETURNING id;

-- name: GetAccount :one
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.phone,
    u.whatsapp,
    COALESCE(sd.region_id, u.region_id, 0)::int AS region_id,
    COALESCE(rg.name, '')::text AS region_name,
    u.school_id,
    COALESCE(sc.name, '')::text AS school_name,
    COALESCE(sc.school_number, '')::text AS school_number,
    COALESCE(sd.name, '')::text AS district_name,
    COALESCE(u.is_activated, FALSE)::bool AS active,
    u.must_change_password,
    u.last_login_at,
    u.created_at
FROM
    users u
    LEFT JOIN schools sc ON sc.id = u.school_id
    LEFT JOIN districts sd ON sd.id = sc.district_id
    LEFT JOIN regions rg ON rg.id = COALESCE(sd.region_id, u.region_id)
WHERE u.id = sqlc.arg(user_id) AND u.deleted_at IS NULL;

-- Regional admins and school managers (never the super admin). region_id limits the
-- list to accounts in that region: its regional admin and its schools' managers.

-- name: ListAccounts :many
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.phone,
    u.whatsapp,
    COALESCE(sd.region_id, u.region_id, 0)::int AS region_id,
    COALESCE(rg.name, '')::text AS region_name,
    u.school_id,
    COALESCE(sc.name, '')::text AS school_name,
    COALESCE(sc.school_number, '')::text AS school_number,
    COALESCE(sd.name, '')::text AS district_name,
    COALESCE(u.is_activated, FALSE)::bool AS active,
    u.must_change_password,
    u.last_login_at,
    u.created_at
FROM
    users u
    LEFT JOIN schools sc ON sc.id = u.school_id
    LEFT JOIN districts sd ON sd.id = sc.district_id
    LEFT JOIN regions rg ON rg.id = COALESCE(sd.region_id, u.region_id)
WHERE
    u.deleted_at IS NULL
    AND u.role <> 'SUPER_ADMIN'
    AND (sqlc.narg(role)::text IS NULL OR u.role = sqlc.narg(role)::text)
    AND (sqlc.narg(region_id)::int IS NULL OR COALESCE(sd.region_id, u.region_id) = sqlc.narg(region_id)::int)
ORDER BY rg.name, u.role, sc.name, u.name;

-- name: CountUsersWithEmail :one
SELECT COUNT(*) FROM users WHERE lower(email) = lower(sqlc.arg(email)::text) AND id <> sqlc.arg(exclude_id)::int;

-- name: CountActiveRegionalAdmins :one
SELECT COUNT(*) FROM users
WHERE role = 'REGIONAL_ADMIN' AND region_id = sqlc.arg(region_id) AND COALESCE(is_activated, FALSE)
    AND deleted_at IS NULL AND id <> sqlc.arg(exclude_id)::int;

-- name: GetSchoolScope :one
SELECT sc.id, sc.name, sc.district_id, d.region_id
FROM schools sc JOIN districts d ON d.id = sc.district_id
WHERE sc.id = sqlc.arg(school_id);

-- name: GetRegionName :one
SELECT name FROM regions WHERE id = sqlc.arg(region_id);

-- name: CreateAccount :one
WITH created AS (
    INSERT INTO users (
        name, display_name, email, password, role, region_id, district_id, school_id,
        phone, whatsapp, is_super_admin, is_activated, must_change_password
    )
    VALUES (
        sqlc.arg(name)::text, sqlc.arg(name)::text, sqlc.arg(email)::text, sqlc.arg(password_hash)::text,
        sqlc.arg(role)::text, sqlc.narg(region_id)::int, sqlc.narg(district_id)::int, sqlc.narg(school_id)::int,
        sqlc.narg(phone)::text, sqlc.narg(whatsapp)::text, FALSE, TRUE, TRUE
    )
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'user', created.id, 'Created', a.id, a.name, a.role, a.school_id, sqlc.arg(note)::text
    FROM created LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT created.id FROM created;

-- name: UpdateAccount :one
WITH updated AS (
    UPDATE users
    SET
        name = sqlc.arg(name)::text,
        display_name = sqlc.arg(name)::text,
        email = sqlc.arg(email)::text,
        phone = sqlc.narg(phone)::text,
        whatsapp = sqlc.narg(whatsapp)::text,
        updated_at = CURRENT_TIMESTAMP
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL AND users.role <> 'SUPER_ADMIN'
    RETURNING users.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'user', updated.id, 'Updated', a.id, a.name, a.role, a.school_id, sqlc.arg(note)::text
    FROM updated LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT updated.id FROM updated;

-- name: SetAccountActive :one
WITH changed AS (
    UPDATE users
    SET is_activated = sqlc.arg(active)::bool, updated_at = CURRENT_TIMESTAMP
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL AND users.role <> 'SUPER_ADMIN'
    RETURNING users.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'user', changed.id, CASE WHEN sqlc.arg(active)::bool THEN 'Activated' ELSE 'Deactivated' END,
        a.id, a.name, a.role, a.school_id, sqlc.arg(note)::text
    FROM changed LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT changed.id FROM changed;

-- name: ResetAccountPassword :one
WITH reset AS (
    UPDATE users
    SET password = sqlc.arg(password_hash)::text, must_change_password = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL AND users.role <> 'SUPER_ADMIN'
    RETURNING users.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'user', reset.id, 'PasswordReset', a.id, a.name, a.role, a.school_id, sqlc.arg(note)::text
    FROM reset LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT reset.id FROM reset;

-- name: ListDirectoryRegions :many
SELECT
    rg.id,
    rg.name,
    rg.office_phone,
    rg.office_email,
    rg.postal_address,
    rg.physical_address,
    a.id AS admin_id,
    a.name AS admin_name,
    COALESCE(a.email, '')::text AS admin_email,
    a.phone AS admin_phone,
    a.whatsapp AS admin_whatsapp
FROM
    regions rg
    LEFT JOIN users a ON a.region_id = rg.id AND a.role = 'REGIONAL_ADMIN'
        AND COALESCE(a.is_activated, FALSE) AND a.deleted_at IS NULL
ORDER BY rg.name;

-- name: ListDirectorySchools :many
SELECT
    sc.id,
    sc.name,
    sc.school_number,
    d.id AS district_id,
    d.name AS district_name,
    rg.id AS region_id,
    rg.name AS region_name,
    sc.phone,
    sc.email,
    sc.postal_address,
    sc.head_teacher_name,
    sc.head_teacher_phone
FROM
    schools sc
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
ORDER BY rg.name, d.name, sc.name;

-- name: ListDirectoryPeople :many
SELECT id, name, email, role, phone, whatsapp, school_id
FROM users
WHERE role IN ('SUPER_ADMIN', 'SCHOOL_MANAGER') AND COALESCE(is_activated, FALSE) AND deleted_at IS NULL
ORDER BY name;

-- name: UpdateRegionOffice :one
WITH updated AS (
    UPDATE regions
    SET
        office_phone = sqlc.narg(office_phone)::text,
        office_email = sqlc.narg(office_email)::text,
        postal_address = sqlc.narg(postal_address)::text,
        physical_address = sqlc.narg(physical_address)::text
    WHERE regions.id = sqlc.arg(region_id)
    RETURNING regions.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
    SELECT 'region', updated.id, 'OfficeUpdated', a.id, a.name, a.role, a.school_id
    FROM updated LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT updated.id FROM updated;

-- name: UpdateSchoolOffice :one
WITH updated AS (
    UPDATE schools
    SET
        phone = sqlc.narg(phone)::text,
        email = sqlc.narg(email)::text,
        postal_address = sqlc.narg(postal_address)::text,
        head_teacher_name = sqlc.narg(head_teacher_name)::text,
        head_teacher_phone = sqlc.narg(head_teacher_phone)::text
    WHERE schools.id = sqlc.arg(school_id)
    RETURNING schools.id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
    SELECT 'school', updated.id, 'OfficeUpdated', a.id, a.name, a.role, a.school_id
    FROM updated LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT updated.id FROM updated;

-- name: ListGradeBands :many
-- The grading scale, highest band first.
SELECT
    id,
    grade,
    min_mark,
    is_pass,
    description,
    updated_at
FROM
    grade_bands
ORDER BY
    min_mark DESC;

-- name: DeleteAllGradeBands :exec
-- Run with CreateGradeBand in one transaction to replace the whole scale.
DELETE FROM
    grade_bands;

-- name: CreateGradeBand :exec
INSERT INTO
    grade_bands (grade, min_mark, is_pass, description)
VALUES
    ($1, $2, $3, $4);
