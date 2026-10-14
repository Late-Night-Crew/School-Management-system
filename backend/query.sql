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
    district_id,
    closed_at;

-- name: ListSchools :many
SELECT
    id,
    school_number,
    name,
    district_id,
    closed_at
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
    district_id,
    closed_at
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
    district_id,
    closed_at;

-- name: ListSchoolsByDistrictId :many
SELECT
    id,
    school_number,
    name,
    district_id,
    closed_at
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
        status,
        national_id,
        jce_number
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id,
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
    national_id,
    jce_number,
    left_on,
    leaving_reason,
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
    national_id,
    jce_number,
    left_on,
    leaving_reason,
    status,
    created_at,
    updated_at
FROM
    students
WHERE
    id = $1;

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
    national_id = $21,
    jce_number = $22,
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
    national_id,
    jce_number,
    left_on,
    leaving_reason,
    status,
    created_at,
    updated_at;

-- name: DeleteStudent :exec
DELETE FROM
    students
WHERE
    id = $1;

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
    national_id,
    jce_number,
    left_on,
    leaving_reason,
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
    national_id = $22,
    jce_number = $23,
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
    national_id,
    jce_number,
    left_on,
    leaving_reason,
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

-- name: GetSchoolDashboardStats :one
SELECT
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.status = 'Active') AS student_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.gender = 'Male' AND s.status = 'Active') AS male_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.gender = 'Female' AND s.status = 'Active') AS female_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = $1 AND s.disability AND s.status = 'Active') AS disability_count,
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
    COALESCE(l.learners, 0)::bigint AS student_count,
    COALESCE(l.male, 0)::bigint AS male_count,
    COALESCE(l.female, 0)::bigint AS female_count,
    COALESCE(l.disability, 0)::bigint AS disability_count,
    COALESCE(ti.moves, 0)::bigint AS transfers_in,
    COALESCE(tout.moves, 0)::bigint AS transfers_out,
    COALESCE(ti.pending, 0)::bigint AS pending_in,
    e.jce_pass_rate,
    e.msce_pass_rate,
    -- Calculated from Term 3 marks (the exam results); preferred over the recorded rates
    tr.jce_pass_rate AS term_jce_pass_rate,
    tr.msce_pass_rate AS term_msce_pass_rate
FROM
    schools sc
    JOIN districts d ON d.id = sc.district_id
    JOIN regions r ON r.id = d.region_id
    LEFT JOIN exam_results e ON e.school_id = sc.id
        AND e.academic_year_id = sqlc.narg(academic_year_id)::int
    LEFT JOIN term_reports tr ON tr.school_id = sc.id AND tr.term = 3
        AND tr.academic_year_id = sqlc.narg(academic_year_id)::int
    -- Counted once per table rather than once per school
    LEFT JOIN (
        SELECT school_id, COUNT(*) AS learners, COUNT(*) FILTER (WHERE gender = 'Male') AS male,
            COUNT(*) FILTER (WHERE gender = 'Female') AS female, COUNT(*) FILTER (WHERE disability) AS disability
        FROM students WHERE status = 'Active' GROUP BY school_id
    ) l ON l.school_id = sc.id
    LEFT JOIN (
        SELECT to_school, COUNT(*) AS moves, COUNT(*) FILTER (WHERE status = 'Pending') AS pending
        FROM transfers GROUP BY to_school
    ) ti ON ti.to_school = sc.id
    LEFT JOIN (SELECT from_school, COUNT(*) AS moves FROM transfers GROUP BY from_school) tout ON tout.from_school = sc.id
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
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.status = 'Active') AS student_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.status = 'Active' AND s.gender = 'Male') AS male_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.status = 'Active' AND s.gender = 'Female') AS female_count,
    (SELECT COUNT(*) FROM students s WHERE s.school_id IN (SELECT id FROM region_schools) AND s.status = 'Active' AND s.disability) AS disability_count,
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
    (SELECT COUNT(*) FROM students s JOIN schools sc ON sc.id = s.school_id WHERE sc.district_id = d.id AND s.status = 'Active') AS student_count
FROM districts d
WHERE d.region_id = $1
ORDER BY d.name;

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
-- Marks of the school's current students. Year, term, student and form (the learner's
-- current form) filters are optional.
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
    AND (sqlc.narg(form_level)::int IS NULL OR s.form_level = sqlc.narg(form_level)::int)
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
     WHERE sc.closed_at IS NULL AND (sqlc.arg(audience_type)::text = 'SCHOOLS_ALL'
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_REGION' AND d.region_id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_DISTRICT' AND d.id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOL' AND sc.id = sqlc.narg(audience_id)::int)))
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
    WHERE sc.closed_at IS NULL AND (sqlc.arg(audience_type)::text = 'SCHOOLS_ALL'
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_REGION' AND d.region_id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOLS_IN_DISTRICT' AND d.id = sqlc.narg(audience_id)::int)
        OR (sqlc.arg(audience_type)::text = 'SCHOOL' AND sc.id = sqlc.narg(audience_id)::int))
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
        WHEN 'SYSTEM' THEN 'OSS (automatic)'
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
WHERE sc.closed_at IS NULL
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
        sqlc.narg(phone)::text, sqlc.narg(whatsapp)::text, sqlc.arg(role)::text = 'SUPER_ADMIN', TRUE, TRUE
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
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL
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
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL
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
    WHERE users.id = sqlc.arg(user_id) AND users.deleted_at IS NULL
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
WHERE sc.closed_at IS NULL
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

-- ============================================================================
-- Deleting, moving and closing schools, districts and divisions. Nothing with records
-- under it can be deleted (the foreign keys refuse too); these counts say what is in
-- the way so the screens can explain it.
-- ============================================================================

-- name: GetSchoolUsage :one
SELECT
    (SELECT COUNT(*) FROM students WHERE school_id = sqlc.arg(school_id)::int)::int AS students,
    (SELECT COUNT(*) FROM student_marks WHERE school_id = sqlc.arg(school_id)::int)::int AS marks,
    (SELECT COUNT(*) FROM transfers WHERE from_school = sqlc.arg(school_id)::int OR to_school = sqlc.arg(school_id)::int)::int AS transfers,
    (SELECT COUNT(*) FROM transfers WHERE to_school = sqlc.arg(school_id)::int AND status IN ('Pending', 'Accepted'))::int AS unfinished_incoming_transfers,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sqlc.arg(school_id)::int
        AND EXISTS (SELECT 1 FROM transfers t WHERE t.student_id = s.id AND t.status = 'Pending'))::int AS students_with_pending_transfers,
    (SELECT COUNT(*) FROM exam_results WHERE school_id = sqlc.arg(school_id)::int)::int AS exam_results,
    (SELECT COUNT(*) FROM users WHERE school_id = sqlc.arg(school_id)::int AND is_activated AND deleted_at IS NULL)::int AS active_accounts;

-- name: GetDistrictUsage :one
SELECT
    (SELECT COUNT(*) FROM schools WHERE district_id = sqlc.arg(district_id)::int)::int AS schools,
    (SELECT COUNT(*) FROM users WHERE district_id = sqlc.arg(district_id)::int AND is_activated AND deleted_at IS NULL)::int AS active_accounts;

-- name: GetRegionUsage :one
SELECT
    (SELECT COUNT(*) FROM districts WHERE region_id = sqlc.arg(region_id)::int)::int AS districts,
    (SELECT COUNT(*) FROM schools sc JOIN districts d ON d.id = sc.district_id WHERE d.region_id = sqlc.arg(region_id)::int)::int AS schools,
    (SELECT COUNT(*) FROM users WHERE region_id = sqlc.arg(region_id)::int AND is_activated AND deleted_at IS NULL)::int AS active_accounts;

-- name: GetSchoolClosedAt :one
SELECT closed_at FROM schools WHERE id = sqlc.arg(school_id)::int;

-- name: ListSchoolNameClashes :many
-- Schools in one district whose names are already taken in another (names are unique per district).
SELECT a.name FROM schools a
JOIN schools b ON b.name = a.name AND b.district_id = sqlc.arg(to_district_id)::int
WHERE a.district_id = sqlc.arg(from_district_id)::int
ORDER BY a.name;

-- name: ListDistrictNameClashes :many
-- Districts in one division whose names are already taken in another.
SELECT a.name FROM districts a
JOIN districts b ON b.name = a.name AND b.region_id = sqlc.arg(to_region_id)::int
WHERE a.region_id = sqlc.arg(from_region_id)::int
ORDER BY a.name;

-- name: MoveDistrictSchools :one
-- Moves every school in a district to another, keeps their managers' accounts in step
-- and writes the audit entry, all in one statement.
WITH moved AS (
    UPDATE schools SET district_id = sqlc.arg(to_district_id)::int
    WHERE district_id = sqlc.arg(from_district_id)::int
    RETURNING id
),
synced AS (
    UPDATE users
    SET district_id = sqlc.arg(to_district_id)::int,
        region_id = (SELECT region_id FROM districts WHERE id = sqlc.arg(to_district_id)::int)
    WHERE school_id IN (SELECT id FROM moved)
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'district', sqlc.arg(from_district_id)::int, 'Schools moved', u.id, u.name, u.role, u.school_id,
        (SELECT COUNT(*) FROM moved) || ' school(s) moved to ' || (SELECT name FROM districts WHERE id = sqlc.arg(to_district_id)::int)
    FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT COUNT(*)::int FROM moved;

-- name: MoveRegionDistricts :one
-- Moves every district in a division to another, with the accounts scoped to them.
WITH moved AS (
    UPDATE districts SET region_id = sqlc.arg(to_region_id)::int
    WHERE region_id = sqlc.arg(from_region_id)::int
    RETURNING id
),
synced AS (
    UPDATE users SET region_id = sqlc.arg(to_region_id)::int
    WHERE district_id IN (SELECT id FROM moved)
        OR school_id IN (SELECT sc.id FROM schools sc WHERE sc.district_id IN (SELECT id FROM moved))
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'region', sqlc.arg(from_region_id)::int, 'Districts moved', u.id, u.name, u.role, u.school_id,
        (SELECT COUNT(*) FROM moved) || ' district(s) moved to ' || (SELECT name FROM regions WHERE id = sqlc.arg(to_region_id)::int)
    FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT COUNT(*)::int FROM moved;

-- name: SyncSchoolAccountScopes :exec
-- School managers' accounts copy their school's district and division; run after a
-- school changes district or a district changes division.
UPDATE users u
SET district_id = sc.district_id, region_id = d.region_id
FROM schools sc
JOIN districts d ON d.id = sc.district_id
WHERE u.school_id = sc.id
    AND (u.district_id IS DISTINCT FROM sc.district_id OR u.region_id IS DISTINCT FROM d.region_id);

-- name: CloseSchool :one
-- Closes a school, deactivates its active accounts and audits both, in one statement.
-- Returns no row if the school does not exist or is already closed.
WITH closed AS (
    UPDATE schools SET closed_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(school_id)::int AND closed_at IS NULL
    RETURNING id, name
),
deactivated AS (
    UPDATE users SET is_activated = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE school_id IN (SELECT id FROM closed) AND is_activated AND deleted_at IS NULL
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'school', closed.id, 'Closed', a.id, a.name, a.role, a.school_id, sqlc.narg(note)::text
    FROM closed LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
    UNION ALL
    SELECT 'user', deactivated.id, 'Deactivated', a.id, a.name, a.role, a.school_id, 'School closed'
    FROM deactivated LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT closed.id, (SELECT COUNT(*) FROM deactivated)::int AS accounts_deactivated FROM closed;

-- name: ReopenSchool :one
-- Reopens a closed school. Its accounts stay deactivated until someone reactivates them.
WITH reopened AS (
    UPDATE schools SET closed_at = NULL
    WHERE id = sqlc.arg(school_id)::int AND closed_at IS NOT NULL
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
    SELECT 'school', reopened.id, 'Reopened', a.id, a.name, a.role, a.school_id
    FROM reopened LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM reopened;

-- name: TransferAllStudents :one
-- Moves every student of one school to another as completed transfers, so each
-- student's history shows the move. Students with a pending transfer are left for that
-- transfer to finish. Audited per transfer and once for the school, in one statement.
WITH movable AS (
    SELECT s.id FROM students s
    WHERE s.school_id = sqlc.arg(from_school_id)::int
        AND NOT EXISTS (SELECT 1 FROM transfers t WHERE t.student_id = s.id AND t.status = 'Pending')
    FOR UPDATE OF s
),
created AS (
    INSERT INTO transfers (student_id, from_school, to_school, status, date_initiated, date_accepted, reason)
    SELECT movable.id, sqlc.arg(from_school_id)::int, sqlc.arg(to_school_id)::int, 'Completed',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, sqlc.arg(reason)::text
    FROM movable
    RETURNING id
),
moved AS (
    UPDATE students SET school_id = sqlc.arg(to_school_id)::int, updated_at = CURRENT_TIMESTAMP
    WHERE id IN (SELECT id FROM movable)
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'transfer', created.id, step.action, u.id, u.name, u.role, u.school_id,
        'Whole-school transfer: ' || sqlc.arg(reason)::text
    FROM created
        CROSS JOIN (VALUES ('Created'), ('Completed')) AS step(action)
        LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
    UNION ALL
    SELECT 'school', sqlc.arg(from_school_id)::int, 'Students transferred', u.id, u.name, u.role, u.school_id,
        (SELECT COUNT(*) FROM moved) || ' student(s) transferred to '
            || (SELECT name FROM schools WHERE id = sqlc.arg(to_school_id)::int) || ': ' || sqlc.arg(reason)::text
    FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT
    (SELECT COUNT(*) FROM created)::int AS transferred,
    (SELECT COUNT(*) FROM students WHERE school_id = sqlc.arg(from_school_id)::int)::int
        - (SELECT COUNT(*) FROM movable)::int AS skipped;

-- ============================================================================
-- School registration requests (see migrations 20-21). Division officers create, edit,
-- submit and delete their own division's requests; the super admin accepts them.
-- Changes are scoped by region in the WHERE clause and audited in the same statement.
-- ============================================================================

-- name: ListSchoolRequests :many
SELECT
    r.id, r.status, r.region_id, COALESCE(rg.name, '')::text AS region_name,
    r.district_id, COALESCE(d.name, '')::text AS district_name, r.school_name,
    r.submitted_at, COALESCE(su.name, '')::text AS submitted_by_name,
    r.decided_at, COALESCE(du.name, '')::text AS decided_by_name,
    r.registration_number, r.school_id, r.created_at, r.updated_at
FROM school_requests r
    LEFT JOIN regions rg ON rg.id = r.region_id
    LEFT JOIN districts d ON d.id = r.district_id
    LEFT JOIN users su ON su.id = r.submitted_by
    LEFT JOIN users du ON du.id = r.decided_by
WHERE (sqlc.narg(region_id)::int IS NULL OR r.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(status)::text IS NULL OR r.status = sqlc.narg(status)::text)
ORDER BY COALESCE(r.submitted_at, r.updated_at) DESC, r.id DESC;

-- name: GetSchoolRequest :one
SELECT
    r.id, r.status, r.region_id, COALESCE(rg.name, '')::text AS region_name,
    r.district_id, COALESCE(d.name, '')::text AS district_name, r.school_name, r.form,
    COALESCE(cu.name, '')::text AS created_by_name,
    r.submitted_at, COALESCE(su.name, '')::text AS submitted_by_name,
    r.decided_at, COALESCE(du.name, '')::text AS decided_by_name,
    r.registration_number, r.school_id, r.created_at, r.updated_at
FROM school_requests r
    LEFT JOIN regions rg ON rg.id = r.region_id
    LEFT JOIN districts d ON d.id = r.district_id
    LEFT JOIN users cu ON cu.id = r.created_by
    LEFT JOIN users su ON su.id = r.submitted_by
    LEFT JOIN users du ON du.id = r.decided_by
WHERE r.id = sqlc.arg(request_id)::int;

-- name: CreateSchoolRequest :one
WITH created AS (
    INSERT INTO school_requests (region_id, district_id, school_name, form, created_by)
    VALUES (sqlc.arg(region_id)::int, sqlc.narg(district_id)::int, sqlc.arg(school_name)::text,
        sqlc.arg(form)::jsonb, sqlc.arg(actor_user_id)::int)
    RETURNING id, school_name
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'school_request', created.id, 'Created', u.id, u.name, u.role, u.school_id, created.school_name
    FROM created LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM created;

-- name: UpdateSchoolRequest :one
WITH updated AS (
    UPDATE school_requests
    SET district_id = sqlc.narg(district_id)::int, school_name = sqlc.arg(school_name)::text,
        form = sqlc.arg(form)::jsonb, updated_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(request_id)::int AND region_id = sqlc.arg(region_id)::int AND status = 'Draft'
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
    SELECT 'school_request', updated.id, 'Updated', u.id, u.name, u.role, u.school_id
    FROM updated LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM updated;

-- name: SubmitSchoolRequest :one
WITH submitted AS (
    UPDATE school_requests
    SET status = 'Submitted', submitted_by = sqlc.arg(actor_user_id)::int, submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(request_id)::int AND region_id = sqlc.arg(region_id)::int AND status = 'Draft'
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id)
    SELECT 'school_request', submitted.id, 'Submitted', u.id, u.name, u.role, u.school_id
    FROM submitted LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM submitted;

-- name: DeleteSchoolRequest :one
WITH deleted AS (
    DELETE FROM school_requests
    WHERE id = sqlc.arg(request_id)::int AND region_id = sqlc.arg(region_id)::int AND status = 'Draft'
    RETURNING id, school_name
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'school_request', deleted.id, 'Deleted', u.id, u.name, u.role, u.school_id, deleted.school_name
    FROM deleted LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM deleted;

-- name: AcceptSchoolRequest :one
-- Creates the school from the request (name, district, registration number, address
-- and head teacher) and marks the request accepted, in one statement.
WITH req AS (
    SELECT * FROM school_requests
    WHERE id = sqlc.arg(request_id)::int AND status = 'Submitted' AND district_id IS NOT NULL
    FOR UPDATE
),
created AS (
    INSERT INTO schools (name, school_number, district_id, postal_address, head_teacher_name, head_teacher_phone)
    SELECT req.school_name, sqlc.arg(registration_number)::text, req.district_id,
        NULLIF(LEFT(req.form->>'address', 255), ''),
        NULLIF(LEFT(req.form->'head_teacher'->>'name', 150), ''),
        NULLIF(LEFT(req.form->'head_teacher'->>'phone', 20), '')
    FROM req
    RETURNING id, name
),
accepted AS (
    UPDATE school_requests
    SET status = 'Accepted', decided_by = sqlc.arg(actor_user_id)::int, decided_at = CURRENT_TIMESTAMP,
        registration_number = sqlc.arg(registration_number)::text,
        school_id = (SELECT id FROM created), updated_at = CURRENT_TIMESTAMP
    WHERE id IN (SELECT id FROM req)
    RETURNING id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'school_request', accepted.id, 'Accepted', u.id, u.name, u.role, u.school_id,
        'Registration number ' || sqlc.arg(registration_number)::text
    FROM accepted LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
    UNION ALL
    SELECT 'school', created.id, 'Created', u.id, u.name, u.role, u.school_id,
        'Registered from school request ' || sqlc.arg(request_id)::int
    FROM created LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM created;

-- name: CountSchoolsWithNumber :one
SELECT COUNT(*)::int FROM schools WHERE LOWER(school_number) = LOWER(sqlc.arg(school_number)::text);

-- name: CountSchoolsWithNameInDistrict :one
SELECT COUNT(*)::int FROM schools WHERE name = sqlc.arg(name)::text AND district_id = sqlc.arg(district_id)::int;

-- name: ListSchoolRequestHistory :many
SELECT action, COALESCE(actor_name, '')::text AS actor_name, COALESCE(actor_role, '')::text AS actor_role,
    COALESCE(note, '')::text AS note, created_at
FROM audit_logs
WHERE entity_type = 'school_request' AND entity_id = sqlc.arg(request_id)::int
ORDER BY created_at, id;

-- ============================================================================
-- Forgot-password requests (see migration 22) and the public lists the sign-in page
-- needs to ask for them.
-- ============================================================================

-- name: ListPublicRegions :many
SELECT id, name FROM regions ORDER BY name;

-- name: ListPublicSchools :many
SELECT sc.id, sc.name, d.region_id
FROM schools sc JOIN districts d ON d.id = sc.district_id
WHERE sc.closed_at IS NULL
ORDER BY sc.name;

-- name: FindAccountForPasswordRequest :one
-- The active account matching what the person told us: email, role, and their division
-- (division officers) or school (school users). Returns who should handle the request.
SELECT u.id,
    -- 0 means MCDE handles it (division officers); otherwise the school's division
    (CASE WHEN u.role = 'SCHOOL_MANAGER' THEN COALESCE(d.region_id, 0) ELSE 0 END)::int AS handler_region_id
FROM users u
    LEFT JOIN schools sc ON sc.id = u.school_id
    LEFT JOIN districts d ON d.id = sc.district_id
WHERE lower(u.email) = lower(sqlc.arg(email)::text)
    AND u.role = sqlc.arg(role)::text
    AND u.is_activated AND u.deleted_at IS NULL
    AND ((u.role = 'REGIONAL_ADMIN' AND u.region_id = sqlc.narg(region_id)::int)
        OR (u.role = 'SCHOOL_MANAGER' AND u.school_id = sqlc.narg(school_id)::int));

-- name: CreatePasswordRequest :exec
WITH created AS (
    INSERT INTO password_reset_requests (user_id, handler_region_id, contact_phone, note, requester_ip)
    VALUES (sqlc.arg(user_id)::int, sqlc.narg(handler_region_id)::int, sqlc.narg(contact_phone)::text,
        sqlc.narg(note)::text, sqlc.narg(requester_ip)::text)
    ON CONFLICT (user_id) WHERE status = 'Pending' DO NOTHING
    RETURNING id, user_id
)
INSERT INTO audit_logs (entity_type, entity_id, action, note)
SELECT 'user', created.user_id, 'PasswordResetRequested', 'Forgot-password request ' || created.id FROM created;

-- name: ListPasswordRequests :many
-- Pending requests the actor handles: all for the super admin, their schools' for a
-- division officer (handler_region_id NULL means MCDE).
SELECT r.id, r.user_id, u.name, u.email, u.role, u.phone, u.whatsapp,
    COALESCE(sc.name, '')::text AS school_name, COALESCE(rg.name, '')::text AS region_name,
    r.contact_phone, r.note, r.handler_region_id, r.created_at
FROM password_reset_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN schools sc ON sc.id = u.school_id
    LEFT JOIN regions rg ON rg.id = COALESCE(u.region_id, r.handler_region_id)
WHERE r.status = 'Pending'
    AND (sqlc.narg(handler_region_id)::int IS NULL OR r.handler_region_id = sqlc.narg(handler_region_id)::int)
ORDER BY r.created_at;

-- name: GetPasswordRequest :one
SELECT id, user_id, handler_region_id, status FROM password_reset_requests WHERE id = sqlc.arg(request_id)::int;

-- name: ClosePasswordRequest :one
WITH closed AS (
    UPDATE password_reset_requests
    SET status = sqlc.arg(status)::text, resolved_by = sqlc.arg(actor_user_id)::int, resolved_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(request_id)::int AND status = 'Pending'
    RETURNING id, user_id
),
logged AS (
    INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
    SELECT 'user', closed.user_id, 'PasswordRequest' || sqlc.arg(status)::text, a.id, a.name, a.role, a.school_id,
        'Forgot-password request ' || closed.id
    FROM closed LEFT JOIN users a ON a.id = sqlc.arg(actor_user_id)::int
)
SELECT id FROM closed;

-- name: FindStudentByNationalID :one
-- Another learner already holding this National ID (exclude_id: the learner being edited).
SELECT s.id, s.first_name, s.last_name, s.student_number, COALESCE(sc.name, '')::text AS school_name
FROM students s LEFT JOIN schools sc ON sc.id = s.school_id
WHERE UPPER(s.national_id) = UPPER(sqlc.arg(national_id)::text) AND s.id <> sqlc.arg(exclude_id)::int
LIMIT 1;

-- name: FindStudentByJCENumber :one
SELECT s.id, s.first_name, s.last_name, s.student_number, COALESCE(sc.name, '')::text AS school_name
FROM students s LEFT JOIN schools sc ON sc.id = s.school_id
WHERE UPPER(s.jce_number) = UPPER(sqlc.arg(jce_number)::text) AND s.id <> sqlc.arg(exclude_id)::int
LIMIT 1;

-- name: ListPossibleDuplicateStudents :many
-- Learners who look like the same person: same first and last name (ignoring case) and
-- the same date of birth or guardian phone. Used to warn, not to block, since two
-- learners can genuinely share a name.
SELECT s.id, s.first_name, s.last_name, s.student_number, s.date_of_birth, s.guardian_phone,
    s.form_level, s.national_id, s.status, COALESCE(sc.name, '')::text AS school_name
FROM students s LEFT JOIN schools sc ON sc.id = s.school_id
WHERE LOWER(s.last_name) = LOWER(sqlc.arg(last_name)::text)
    AND LOWER(s.first_name) = LOWER(sqlc.arg(first_name)::text)
    AND s.id <> sqlc.arg(exclude_id)::int
    AND ((sqlc.narg(date_of_birth)::date IS NOT NULL AND s.date_of_birth = sqlc.narg(date_of_birth)::date)
        -- Phones are stored as typed, so compare the last 9 digits (any Malawi format)
        OR (sqlc.narg(guardian_phone)::text IS NOT NULL
            AND RIGHT(regexp_replace(s.guardian_phone, '\D', '', 'g'), 9) = RIGHT(regexp_replace(sqlc.narg(guardian_phone)::text, '\D', '', 'g'), 9)))
ORDER BY s.last_name, s.first_name
LIMIT 10;

-- ============================================================================
-- Terms and year-end promotion (see migration 24).
-- ============================================================================

-- name: GetPromotionSettings :one
SELECT automatic, subjects_to_pass, jce_subjects_to_pass, msce_subjects_to_pass, updated_at FROM promotion_settings WHERE id = 1;

-- name: UpdatePromotionSettings :exec
WITH updated AS (
    UPDATE promotion_settings
    SET automatic = sqlc.arg(automatic)::bool, subjects_to_pass = sqlc.arg(subjects_to_pass)::int,
        jce_subjects_to_pass = sqlc.arg(jce_subjects_to_pass)::int, msce_subjects_to_pass = sqlc.arg(msce_subjects_to_pass)::int,
        updated_by = sqlc.arg(actor_user_id)::int, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'promotion_settings', NULL, 'Updated', u.id, u.name, u.role, u.school_id,
    CASE WHEN sqlc.arg(automatic)::bool THEN 'Automatic' ELSE 'Manual' END || ' promotion, '
        || sqlc.arg(subjects_to_pass)::int || ' subjects to pass; JCE ' || sqlc.arg(jce_subjects_to_pass)::int
        || ', MSCE ' || sqlc.arg(msce_subjects_to_pass)::int || ' (plus compulsory subjects)'
FROM updated LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: GetDefaultAcademicYear :one
-- The year a school without a stage is in: the latest year that has started, else the
-- first one to come.
SELECT id, year FROM academic_years
ORDER BY (start_date <= sqlc.arg(today)::date) DESC,
    CASE WHEN start_date <= sqlc.arg(today)::date THEN -year ELSE year END
LIMIT 1;

-- name: GetAcademicYearByIDForStage :one
SELECT id, year FROM academic_years WHERE id = sqlc.arg(academic_year_id)::int;

-- name: GetNextAcademicYear :one
SELECT id, year FROM academic_years WHERE year > sqlc.arg(year)::int ORDER BY year LIMIT 1;

-- name: GetSchoolStage :one
SELECT academic_year_id, term FROM school_stages WHERE school_id = sqlc.arg(school_id)::int;

-- name: ListSchoolStages :many
-- Every open school with its stage (NULL when it has none yet) and division.
SELECT sc.id AS school_id, sc.name AS school_name, sc.school_number, d.name AS district_name,
    rg.name AS region_name, st.academic_year_id, st.term,
    (SELECT COUNT(*) FROM students s WHERE s.school_id = sc.id AND s.status = 'Active')::int AS learners
FROM schools sc
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
    LEFT JOIN school_stages st ON st.school_id = sc.id
WHERE sc.closed_at IS NULL
ORDER BY rg.name, d.name, sc.name;

-- name: SetSchoolStage :exec
WITH saved AS (
    INSERT INTO school_stages (school_id, academic_year_id, term, updated_by, updated_at)
    VALUES (sqlc.arg(school_id)::int, sqlc.arg(academic_year_id)::int, sqlc.arg(term)::int,
        sqlc.arg(actor_user_id)::int, CURRENT_TIMESTAMP)
    ON CONFLICT (school_id) DO UPDATE
    SET academic_year_id = EXCLUDED.academic_year_id, term = EXCLUDED.term,
        updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at
    RETURNING school_id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'school', saved.school_id, 'StageChanged', u.id, u.name, u.role, u.school_id, sqlc.arg(note)::text
FROM saved LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: ListYearEndLearners :many
-- A school's current learners with how many subjects they passed in Term 3 of the year.
-- Learners who already have a result for the year are left out.
-- For Forms 2 and 4 (JCE, MSCE) it also counts the exam's compulsory subjects passed.
SELECT s.id, s.first_name, s.last_name, s.student_number, COALESCE(s.form_level, 1)::int AS form_level,
    (COUNT(m.id) FILTER (WHERE m.mark >= sqlc.arg(pass_mark)::int))::int AS subjects_passed,
    COUNT(m.id)::int AS subjects_marked,
    (COUNT(m.id) FILTER (WHERE m.mark >= sqlc.arg(pass_mark)::int AND m.subject_id IN (
        SELECT c.subject_id FROM exam_compulsory_subjects c
        WHERE c.exam = CASE s.form_level WHEN 2 THEN 'JCE' WHEN 4 THEN 'MSCE' END)))::int AS compulsory_passed,
    (SELECT COUNT(*) FROM exam_compulsory_subjects c
        WHERE c.exam = CASE s.form_level WHEN 2 THEN 'JCE' WHEN 4 THEN 'MSCE' END)::int AS compulsory_required
FROM students s
    LEFT JOIN student_marks m ON m.student_id = s.id AND m.academic_year_id = sqlc.arg(academic_year_id)::int AND m.term = 3
WHERE s.school_id = sqlc.arg(school_id)::int
    AND s.status = 'Active'
    AND NOT EXISTS (SELECT 1 FROM promotions p WHERE p.student_id = s.id AND p.academic_year_id = sqlc.arg(academic_year_id)::int)
GROUP BY s.id
ORDER BY s.form_level, s.last_name, s.first_name;

-- name: ListYearResults :many
-- A school's year-end results for one academic year.
SELECT p.student_id, s.first_name, s.last_name, s.student_number, p.from_form, p.to_form,
    p.subjects_passed, p.outcome, p.automatic, COALESCE(u.name, '')::text AS decided_by_name, p.decided_at
FROM promotions p
    JOIN students s ON s.id = p.student_id
    LEFT JOIN users u ON u.id = p.decided_by
WHERE p.school_id = sqlc.arg(school_id)::int AND p.academic_year_id = sqlc.arg(academic_year_id)::int
ORDER BY p.from_form, s.last_name, s.first_name;

-- name: GetPromotionForProceed :one
SELECT p.id, p.from_form, p.outcome, s.school_id AS current_school_id, COALESCE(s.form_level, 0)::int AS current_form
FROM promotions p JOIN students s ON s.id = p.student_id
WHERE p.student_id = sqlc.arg(student_id)::int AND p.academic_year_id = sqlc.arg(academic_year_id)::int;

-- name: ProceedAfterRepeat :exec
-- A Form 1 or Form 3 learner who failed is allowed to move up after all.
WITH changed AS (
    UPDATE promotions SET outcome = 'Proceeded', to_form = from_form + 1, decided_by = sqlc.arg(actor_user_id)::int,
        decided_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(promotion_id)::int AND outcome = 'Repeat' AND from_form IN (1, 3)
    RETURNING student_id, from_form
),
moved AS (
    UPDATE students SET form_level = changed.from_form + 1, updated_at = CURRENT_TIMESTAMP
    FROM changed WHERE students.id = changed.student_id
    RETURNING students.id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'student', changed.student_id, 'AllowedToProceed', u.id, u.name, u.role, u.school_id,
    'Failed Form ' || changed.from_form || ' but allowed to proceed to Form ' || (changed.from_form + 1)
FROM changed LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: GetPreviousAcademicYear :one
SELECT id, year FROM academic_years WHERE year < sqlc.arg(year)::int ORDER BY year DESC LIMIT 1;

-- ============================================================================
-- Exam pass rules and end-of-term reports (see migration 25).
-- ============================================================================

-- name: ListExamCompulsorySubjects :many
SELECT c.exam, c.subject_id, sb.name AS subject_name
FROM exam_compulsory_subjects c JOIN subjects sb ON sb.id = c.subject_id
ORDER BY c.exam, sb.name;

-- name: ClearExamCompulsorySubjects :exec
DELETE FROM exam_compulsory_subjects WHERE exam = sqlc.arg(exam)::text;

-- name: AddExamCompulsorySubject :exec
INSERT INTO exam_compulsory_subjects (exam, subject_id) VALUES (sqlc.arg(exam)::text, sqlc.arg(subject_id)::int)
ON CONFLICT DO NOTHING;

-- name: ListTermMarks :many
-- Every mark a school recorded in one term, with each learner's form during that year
-- (from their year-end result if the year is finished, otherwise their current form).
-- (The form is looked up per mark by key; joining students hashed every learner nationally.)
SELECT m.student_id, m.subject_id, sb.name AS subject_name, m.mark,
    COALESCE((SELECT p.from_form FROM promotions p WHERE p.student_id = m.student_id AND p.academic_year_id = m.academic_year_id),
        (SELECT s.form_level FROM students s WHERE s.id = m.student_id), 1)::int AS form_level
FROM student_marks m
    JOIN subjects sb ON sb.id = m.subject_id
WHERE m.school_id = sqlc.arg(school_id)::int AND m.academic_year_id = sqlc.arg(academic_year_id)::int
    AND m.term = sqlc.arg(term)::int
ORDER BY m.student_id, m.subject_id;

-- name: SaveTermReport :exec
WITH saved AS (
    INSERT INTO term_reports (school_id, academic_year_id, term, learners_assessed, average_mark, pass_rate,
        jce_pass_rate, msce_pass_rate, details, marks_fingerprint, generated_by, generated_at)
    VALUES (sqlc.arg(school_id)::int, sqlc.arg(academic_year_id)::int, sqlc.arg(term)::int,
        sqlc.arg(learners_assessed)::int, sqlc.narg(average_mark)::float8, sqlc.narg(pass_rate)::float8,
        sqlc.narg(jce_pass_rate)::float8, sqlc.narg(msce_pass_rate)::float8, sqlc.arg(details)::jsonb,
        sqlc.arg(marks_fingerprint)::text, sqlc.arg(actor_user_id)::int, CURRENT_TIMESTAMP)
    ON CONFLICT (school_id, academic_year_id, term) DO UPDATE
    SET learners_assessed = EXCLUDED.learners_assessed, average_mark = EXCLUDED.average_mark,
        pass_rate = EXCLUDED.pass_rate, jce_pass_rate = EXCLUDED.jce_pass_rate,
        msce_pass_rate = EXCLUDED.msce_pass_rate, details = EXCLUDED.details,
        marks_fingerprint = EXCLUDED.marks_fingerprint, generated_by = EXCLUDED.generated_by,
        generated_at = EXCLUDED.generated_at
    RETURNING school_id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'school', saved.school_id, 'TermReport', u.id, u.name, u.role, u.school_id, sqlc.arg(note)::text
FROM saved LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: GetTermReport :one
SELECT tr.id, tr.school_id, tr.academic_year_id, ay.year, tr.term, tr.learners_assessed, tr.average_mark,
    tr.pass_rate, tr.jce_pass_rate, tr.msce_pass_rate, tr.details, tr.marks_fingerprint,
    COALESCE(u.name, '')::text AS generated_by_name, tr.generated_at
FROM term_reports tr
    JOIN academic_years ay ON ay.id = tr.academic_year_id
    LEFT JOIN users u ON u.id = tr.generated_by
WHERE tr.school_id = sqlc.arg(school_id)::int AND tr.academic_year_id = sqlc.arg(academic_year_id)::int
    AND tr.term = sqlc.arg(term)::int;

-- name: ListSchoolTermReports :many
SELECT tr.academic_year_id, ay.year, tr.term, tr.learners_assessed, tr.average_mark, tr.pass_rate,
    tr.jce_pass_rate, tr.msce_pass_rate, tr.details, tr.marks_fingerprint, tr.generated_at
FROM term_reports tr JOIN academic_years ay ON ay.id = tr.academic_year_id
WHERE tr.school_id = sqlc.arg(school_id)::int
ORDER BY ay.year DESC, tr.term DESC;

-- name: ListTermReportsForTerm :many
-- Every school's report for one term, for the national and division comparisons.
SELECT sc.id AS school_id, sc.name AS school_name, sc.school_number, d.name AS district_name,
    rg.id AS region_id, rg.name AS region_name,
    tr.learners_assessed, tr.average_mark, tr.pass_rate, tr.jce_pass_rate, tr.msce_pass_rate, tr.generated_at
FROM term_reports tr
    JOIN schools sc ON sc.id = tr.school_id
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
WHERE tr.academic_year_id = sqlc.arg(academic_year_id)::int AND tr.term = sqlc.arg(term)::int
    AND (sqlc.narg(region_id)::int IS NULL OR rg.id = sqlc.narg(region_id)::int)
ORDER BY rg.name, d.name, sc.name;

-- name: ListStudentTermSummaries :many
-- A learner's average and subjects passed in each term they have marks for.
SELECT m.academic_year_id, ay.year, m.term, COUNT(*)::int AS subjects_marked,
    AVG(m.mark)::float8 AS average_mark,
    (COUNT(*) FILTER (WHERE m.mark >= sqlc.arg(pass_mark)::int))::int AS subjects_passed,
    COALESCE(MAX(sc.name), '')::text AS school_name
FROM student_marks m
    JOIN academic_years ay ON ay.id = m.academic_year_id
    LEFT JOIN schools sc ON sc.id = m.school_id
WHERE m.student_id = sqlc.arg(student_id)::int
GROUP BY m.academic_year_id, ay.year, m.term
ORDER BY ay.year DESC, m.term DESC;

-- ============================================================================
-- Term dates and reminders (see migration 26).
-- ============================================================================

-- name: ListTermDates :many
SELECT t.academic_year_id, ay.year, t.term, t.start_date, t.end_date
FROM academic_year_terms t JOIN academic_years ay ON ay.id = t.academic_year_id
ORDER BY ay.year DESC, t.term;

-- name: GetTermDates :one
SELECT start_date, end_date FROM academic_year_terms
WHERE academic_year_id = sqlc.arg(academic_year_id)::int AND term = sqlc.arg(term)::int;

-- name: ClearTermDates :exec
DELETE FROM academic_year_terms WHERE academic_year_id = sqlc.arg(academic_year_id)::int;

-- name: AddTermDates :exec
INSERT INTO academic_year_terms (academic_year_id, term, start_date, end_date)
VALUES (sqlc.arg(academic_year_id)::int, sqlc.arg(term)::int, sqlc.arg(start_date)::date, sqlc.arg(end_date)::date);

-- name: LogTermDatesChange :exec
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'academic_year', sqlc.arg(academic_year_id)::int, 'TermDatesSet', u.id, u.name, u.role, u.school_id, sqlc.arg(note)::text
FROM (SELECT 1) AS one LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: ClaimTermReminder :one
-- Records that a reminder is being sent; returns no row if it already was.
INSERT INTO term_reminders (school_id, academic_year_id, term, kind)
VALUES (sqlc.arg(school_id)::int, sqlc.arg(academic_year_id)::int, sqlc.arg(term)::int, sqlc.arg(kind)::text)
ON CONFLICT DO NOTHING
RETURNING kind;

-- name: CreateTermReminderNotice :exec
-- An automatic notice to one school or division office, with a priority and due date.
WITH n AS (
    INSERT INTO notices (kind, sender_party_type, sender_party_id, title, body, priority, due_date, audience_type, audience_id)
    VALUES ('SYSTEM', 'SYSTEM', 0, sqlc.arg(title)::text, sqlc.arg(body)::text, sqlc.arg(priority)::text,
        sqlc.narg(due_date)::date, CASE sqlc.arg(party_type)::text WHEN 'REGION' THEN 'REGIONAL_ADMIN' ELSE 'SCHOOL' END,
        sqlc.arg(party_id)::int)
    RETURNING id
)
INSERT INTO notice_recipients (notice_id, party_type, party_id)
SELECT n.id, sqlc.arg(party_type)::text, sqlc.arg(party_id)::int FROM n;

-- name: GetSchoolRegionForReminder :one
SELECT d.region_id, sc.name FROM schools sc JOIN districts d ON d.id = sc.district_id WHERE sc.id = sqlc.arg(school_id)::int;

-- name: GetReminderSettings :one
SELECT days_before, overdue_after, escalate_after, updated_at FROM reminder_settings WHERE id = 1;

-- name: UpdateReminderSettings :exec
WITH updated AS (
    UPDATE reminder_settings
    SET days_before = sqlc.arg(days_before)::int, overdue_after = sqlc.arg(overdue_after)::int,
        escalate_after = sqlc.arg(escalate_after)::int, updated_by = sqlc.arg(actor_user_id)::int,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'reminder_settings', NULL, 'Updated', u.id, u.name, u.role, u.school_id,
    'Remind ' || sqlc.arg(days_before)::int || ' days before; urgent ' || sqlc.arg(overdue_after)::int
        || ' days after; division told ' || sqlc.arg(escalate_after)::int || ' days after'
FROM updated LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int;

-- name: ListTermDatesForYear :many
SELECT term, start_date, end_date FROM academic_year_terms
WHERE academic_year_id = sqlc.arg(academic_year_id)::int ORDER BY term;

-- name: SyncAcademicYearStatuses :exec
-- Status follows the dates: Upcoming before the start, Completed after the end, else Active.
UPDATE academic_years
SET status = CASE
        WHEN sqlc.arg(today)::date < start_date THEN 'Upcoming'
        WHEN sqlc.arg(today)::date > end_date THEN 'Completed'
        ELSE 'Active'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE status IS DISTINCT FROM CASE
        WHEN sqlc.arg(today)::date < start_date THEN 'Upcoming'
        WHEN sqlc.arg(today)::date > end_date THEN 'Completed'
        ELSE 'Active'
    END;

-- name: CountOverlappingAcademicYears :one
-- Other years whose dates overlap these (years may not overlap: one is active at a time).
SELECT COUNT(*)::int FROM academic_years
WHERE id <> sqlc.arg(exclude_id)::int
    AND start_date <= sqlc.arg(end_date)::date AND end_date >= sqlc.arg(start_date)::date;

-- name: SetLearnerLeft :one
-- Marks an active learner as Withdrawn or DroppedOut (optionally only at one school).
WITH changed AS (
    UPDATE students
    SET status = sqlc.arg(status)::text, left_on = sqlc.arg(left_on)::date,
        leaving_reason = sqlc.narg(reason)::text, updated_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(student_id)::int AND status = 'Active'
        AND (sqlc.narg(school_id)::int IS NULL OR school_id = sqlc.narg(school_id)::int)
    RETURNING id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'student', changed.id, sqlc.arg(status)::text, u.id, u.name, u.role, u.school_id,
    'Left on ' || sqlc.arg(left_on)::date || COALESCE(': ' || sqlc.narg(reason)::text, '')
FROM changed LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
RETURNING entity_id;

-- name: ReinstateLearner :one
WITH changed AS (
    UPDATE students
    SET status = 'Active', left_on = NULL, leaving_reason = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = sqlc.arg(student_id)::int AND status IN ('Withdrawn', 'DroppedOut')
        AND (sqlc.narg(school_id)::int IS NULL OR school_id = sqlc.narg(school_id)::int)
    RETURNING id
)
INSERT INTO audit_logs (entity_type, entity_id, action, actor_user_id, actor_name, actor_role, actor_school_id, note)
SELECT 'student', changed.id, 'Reinstated', u.id, u.name, u.role, u.school_id, 'Back at school'
FROM changed LEFT JOIN users u ON u.id = sqlc.arg(actor_user_id)::int
RETURNING entity_id;

-- name: GetLearnerState :one
SELECT status, school_id, left_on, leaving_reason,
    EXISTS (SELECT 1 FROM transfers t WHERE t.student_id = students.id AND t.status IN ('Pending', 'Accepted'))::bool AS transfer_open
FROM students WHERE id = sqlc.arg(student_id)::int;

-- name: CountOtherActiveSuperAdmins :one
SELECT COUNT(*)::int FROM users
WHERE role = 'SUPER_ADMIN' AND is_activated AND deleted_at IS NULL AND id <> sqlc.arg(exclude_id)::int;

-- ============================================================================
-- Activity log: the audit_logs written throughout the app, for MCDE to search.
-- ============================================================================

-- name: ListAuditLogs :many
-- One page of the log, newest first, with what each entry is about as a readable label.
-- Counted separately (CountAuditLogs) so the page is read straight from the index.
SELECT a.id, a.entity_type, COALESCE(a.entity_id, 0)::int AS entity_id, a.action,
    COALESCE(a.actor_user_id, 0)::int AS actor_user_id, COALESCE(a.actor_name, '')::text AS actor_name,
    COALESCE(a.actor_role, '')::text AS actor_role, COALESCE(a.note, '')::text AS note, a.created_at,
    COALESCE(CASE a.entity_type
        WHEN 'school' THEN (SELECT name FROM schools WHERE id = a.entity_id)
        WHEN 'user' THEN (SELECT name || ' (' || email || ')' FROM users WHERE id = a.entity_id)
        WHEN 'student' THEN (SELECT first_name || ' ' || last_name || ' (' || student_number || ')' FROM students WHERE id = a.entity_id)
        WHEN 'region' THEN (SELECT name || ' division' FROM regions WHERE id = a.entity_id)
        WHEN 'district' THEN (SELECT name || ' district' FROM districts WHERE id = a.entity_id)
        WHEN 'academic_year' THEN (SELECT year::text FROM academic_years WHERE id = a.entity_id)
        WHEN 'transfer' THEN (SELECT st.first_name || ' ' || st.last_name || ' (transfer)' FROM transfers t JOIN students st ON st.id = t.student_id WHERE t.id = a.entity_id)
        WHEN 'school_request' THEN (SELECT school_name || ' (request)' FROM school_requests WHERE id = a.entity_id)
        WHEN 'notice' THEN (SELECT title FROM notices WHERE id = a.entity_id)
    END, '')::text AS entity_label
FROM audit_logs a
WHERE (sqlc.narg(actor_user_id)::int IS NULL OR a.actor_user_id = sqlc.narg(actor_user_id)::int)
    AND (sqlc.narg(actor_role)::text IS NULL OR a.actor_role = sqlc.narg(actor_role)::text)
    AND (sqlc.narg(entity_type)::text IS NULL OR a.entity_type = sqlc.narg(entity_type)::text)
    AND (sqlc.narg(from_date)::date IS NULL OR a.created_at >= sqlc.narg(from_date)::date)
    AND (sqlc.narg(to_date)::date IS NULL OR a.created_at < sqlc.narg(to_date)::date + 1)
    AND (sqlc.narg(search)::text IS NULL OR a.note ILIKE '%' || sqlc.narg(search)::text || '%'
        OR a.action ILIKE '%' || sqlc.narg(search)::text || '%'
        OR a.actor_name ILIKE '%' || sqlc.narg(search)::text || '%')
ORDER BY a.created_at DESC, a.id DESC
LIMIT sqlc.arg(page_size)::int OFFSET sqlc.arg(page_offset)::int;

-- name: CountAuditLogs :one
-- How many entries match ListAuditLogs' filters.
SELECT COUNT(*)::int FROM audit_logs a
WHERE (sqlc.narg(actor_user_id)::int IS NULL OR a.actor_user_id = sqlc.narg(actor_user_id)::int)
    AND (sqlc.narg(actor_role)::text IS NULL OR a.actor_role = sqlc.narg(actor_role)::text)
    AND (sqlc.narg(entity_type)::text IS NULL OR a.entity_type = sqlc.narg(entity_type)::text)
    AND (sqlc.narg(from_date)::date IS NULL OR a.created_at >= sqlc.narg(from_date)::date)
    AND (sqlc.narg(to_date)::date IS NULL OR a.created_at < sqlc.narg(to_date)::date + 1)
    AND (sqlc.narg(search)::text IS NULL OR a.note ILIKE '%' || sqlc.narg(search)::text || '%'
        OR a.action ILIKE '%' || sqlc.narg(search)::text || '%'
        OR a.actor_name ILIKE '%' || sqlc.narg(search)::text || '%');

-- name: ListAuditActors :many
-- Everyone who appears in the log, for the "who" filter.
SELECT a.actor_user_id::int AS id, MAX(a.actor_name)::text AS name, MAX(a.actor_role)::text AS role, COUNT(*)::int AS entries
FROM audit_logs a
WHERE a.actor_user_id IS NOT NULL
GROUP BY a.actor_user_id
ORDER BY CASE MAX(a.actor_role) WHEN 'SUPER_ADMIN' THEN 0 WHEN 'REGIONAL_ADMIN' THEN 1 ELSE 2 END, MAX(a.actor_name);

-- Dashboard charts. Every Insight query covers the whole country, one division
-- (region_id) or one school (school_id).

-- name: InsightLearnersByForm :many
-- Current learners by form and gender.
SELECT COALESCE(s.form_level, 0)::int AS form_level, COALESCE(s.gender, '')::text AS gender,
    COUNT(*)::int AS learners, COUNT(*) FILTER (WHERE s.disability)::int AS with_disability
FROM students s
    JOIN schools sc ON sc.id = s.school_id
    JOIN districts d ON d.id = sc.district_id
WHERE s.status = 'Active'
    AND (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR s.school_id = sqlc.narg(school_id)::int)
GROUP BY 1, 2
ORDER BY 1, 2;

-- name: InsightLearnerStatuses :many
-- Learners by status: current, withdrawn, dropped out, completed Form 4.
SELECT s.status, COUNT(*)::int AS learners
FROM students s
    JOIN schools sc ON sc.id = s.school_id
    JOIN districts d ON d.id = sc.district_id
WHERE (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR s.school_id = sqlc.narg(school_id)::int)
GROUP BY 1;

-- name: InsightAreas :many
-- Open schools and current learners per division (country) or per district (a division).
SELECT CASE WHEN sqlc.narg(region_id)::int IS NULL THEN rg.id ELSE d.id END::int AS id,
    CASE WHEN sqlc.narg(region_id)::int IS NULL THEN rg.name ELSE d.name END::text AS name,
    COUNT(sc.id) FILTER (WHERE sc.closed_at IS NULL)::int AS schools,
    COALESCE(SUM(l.learners), 0)::int AS learners,
    COALESCE(SUM(l.female), 0)::int AS female
FROM regions rg
    JOIN districts d ON d.region_id = rg.id
    LEFT JOIN schools sc ON sc.district_id = d.id
    LEFT JOIN (
        SELECT school_id, COUNT(*) AS learners, COUNT(*) FILTER (WHERE gender = 'Female') AS female
        FROM students WHERE status = 'Active' GROUP BY school_id
    ) l ON l.school_id = sc.id
WHERE sqlc.narg(region_id)::int IS NULL OR rg.id = sqlc.narg(region_id)::int
GROUP BY 1, 2
ORDER BY 2;

-- name: InsightSchoolTerms :many
-- Open schools by the term they are in (0: not started in the system yet).
SELECT COALESCE(st.term, 0)::int AS term, COUNT(*)::int AS schools
FROM schools sc
    JOIN districts d ON d.id = sc.district_id
    LEFT JOIN school_stages st ON st.school_id = sc.id
WHERE sc.closed_at IS NULL
    AND (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
GROUP BY 1
ORDER BY 1;

-- name: InsightTermReports :many
-- Saved end-of-term reports from min_year on, oldest first, with each school's area.
SELECT tr.school_id, tr.academic_year_id, ay.year, tr.term, tr.learners_assessed, tr.details,
    CASE WHEN sqlc.narg(region_id)::int IS NULL THEN rg.id ELSE d.id END::int AS area_id,
    CASE WHEN sqlc.narg(region_id)::int IS NULL THEN rg.name ELSE d.name END::text AS area_name
FROM term_reports tr
    JOIN academic_years ay ON ay.id = tr.academic_year_id
    JOIN schools sc ON sc.id = tr.school_id
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
WHERE ay.year >= sqlc.arg(min_year)::int
    AND (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR tr.school_id = sqlc.narg(school_id)::int)
ORDER BY ay.year, tr.term, tr.school_id;

-- name: SearchStudents :many
-- One page of learners for the learner lists (country, division, district or school),
-- with where each one is. Counted separately (CountStudents).
-- status: Active, Left (withdrawn or dropped out) or Completed; NULL for everyone.
SELECT s.id, s.student_number, s.first_name, COALESCE(s.middle_name, '')::text AS middle_name, s.last_name,
    s.date_of_birth, COALESCE(s.gender, '')::text AS gender, COALESCE(s.form_level, 0)::int AS form_level,
    COALESCE(s.guardian_name, '')::text AS guardian_name, COALESCE(s.guardian_phone, '')::text AS guardian_phone,
    COALESCE(s.guardian_alt_phone, '')::text AS guardian_alt_phone, COALESCE(s.guardian_email, '')::text AS guardian_email,
    COALESCE(s.guardian_relationship, '')::text AS guardian_relationship,
    COALESCE(s.previous_school, '')::text AS previous_school, COALESCE(s.previous_school_id, 0)::int AS previous_school_id,
    s.school_id, COALESCE(s.academic_year_id, 0)::int AS academic_year_id, COALESCE(s.disability, false)::bool AS disability,
    COALESCE(s.disability_details, '')::text AS disability_details, COALESCE(s.national_id, '')::text AS national_id,
    COALESCE(s.jce_number, '')::text AS jce_number, s.status, s.left_on, COALESCE(s.leaving_reason, '')::text AS leaving_reason,
    sc.name AS school_name, sc.district_id, d.name AS district_name, d.region_id, rg.name AS region_name
FROM students s
    JOIN schools sc ON sc.id = s.school_id
    JOIN districts d ON d.id = sc.district_id
    JOIN regions rg ON rg.id = d.region_id
WHERE (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(district_id)::int IS NULL OR sc.district_id = sqlc.narg(district_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR s.school_id = sqlc.narg(school_id)::int)
    AND (sqlc.narg(form_level)::int IS NULL OR s.form_level = sqlc.narg(form_level)::int)
    AND (sqlc.narg(status)::text IS NULL
        OR (sqlc.narg(status)::text = 'Left' AND s.status IN ('Withdrawn', 'DroppedOut'))
        OR s.status = sqlc.narg(status)::text)
    AND (sqlc.narg(search)::text IS NULL
        OR s.student_number ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name) ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.last_name || ' ' || s.first_name) ILIKE '%' || sqlc.narg(search)::text || '%'
        OR UPPER(s.national_id) = UPPER(sqlc.narg(search)::text)
        OR UPPER(s.jce_number) = UPPER(sqlc.narg(search)::text))
ORDER BY s.last_name, s.first_name, s.id
LIMIT sqlc.arg(page_size)::int OFFSET sqlc.arg(page_offset)::int;

-- name: CountStudents :one
-- How many learners match SearchStudents' filters.
SELECT COUNT(*)::int FROM students s
    JOIN schools sc ON sc.id = s.school_id
    JOIN districts d ON d.id = sc.district_id
WHERE (sqlc.narg(region_id)::int IS NULL OR d.region_id = sqlc.narg(region_id)::int)
    AND (sqlc.narg(district_id)::int IS NULL OR sc.district_id = sqlc.narg(district_id)::int)
    AND (sqlc.narg(school_id)::int IS NULL OR s.school_id = sqlc.narg(school_id)::int)
    AND (sqlc.narg(form_level)::int IS NULL OR s.form_level = sqlc.narg(form_level)::int)
    AND (sqlc.narg(status)::text IS NULL
        OR (sqlc.narg(status)::text = 'Left' AND s.status IN ('Withdrawn', 'DroppedOut'))
        OR s.status = sqlc.narg(status)::text)
    AND (sqlc.narg(search)::text IS NULL
        OR s.student_number ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || s.last_name) ILIKE '%' || sqlc.narg(search)::text || '%'
        OR (s.last_name || ' ' || s.first_name) ILIKE '%' || sqlc.narg(search)::text || '%'
        OR UPPER(s.national_id) = UPPER(sqlc.narg(search)::text)
        OR UPPER(s.jce_number) = UPPER(sqlc.narg(search)::text));

-- name: ListSubjectIDsForStudents :many
-- Subject choices of several learners at once.
SELECT student_id, subject_id FROM student_subjects
WHERE student_id = ANY(sqlc.arg(student_ids)::int[])
ORDER BY student_id, subject_id;

-- name: ListTermMarkFingerprints :many
-- The fingerprint of each term's marks at a school, worked out in the database; the
-- same SHA-256 as computeTermReport, so it can be compared with saved reports.
SELECT m.academic_year_id, m.term,
    encode(sha256(convert_to(string_agg(m.student_id || ':' || m.subject_id || ':' || m.mark || ';', ''
        ORDER BY m.student_id, m.subject_id), 'UTF8')), 'hex')::text AS fingerprint
FROM student_marks m
WHERE m.school_id = sqlc.arg(school_id)::int
    AND (sqlc.narg(academic_year_id)::int IS NULL OR m.academic_year_id = sqlc.narg(academic_year_id)::int)
    AND (sqlc.narg(term)::int IS NULL OR m.term = sqlc.narg(term)::int)
GROUP BY m.academic_year_id, m.term;

-- name: LockSchoolStage :one
-- A school's stage, locked until the transaction ends, so two moves cannot overlap.
SELECT academic_year_id, term FROM school_stages WHERE school_id = sqlc.arg(school_id)::int FOR UPDATE;

-- name: CreatePromotions :exec
-- Year-end results of many learners at once (arrays in the same order).
INSERT INTO promotions (student_id, school_id, academic_year_id, from_form, to_form, subjects_passed, outcome, automatic, decided_by)
SELECT unnest(sqlc.arg(student_ids)::int[]), sqlc.arg(school_id)::int, sqlc.arg(academic_year_id)::int,
    unnest(sqlc.arg(from_forms)::int[]), unnest(sqlc.arg(to_forms)::int[]), unnest(sqlc.arg(subjects_passed)::int[]),
    unnest(sqlc.arg(outcomes)::text[]), sqlc.arg(automatic)::bool, sqlc.arg(actor_user_id)::int;

-- name: MoveStudentsAfterYearEnd :exec
-- Moves many learners into the new academic year at once: Completed learners keep
-- their form and become 'Completed'; everyone else is Active at their new form.
UPDATE students s
SET form_level = u.form_level, status = u.status, academic_year_id = sqlc.arg(academic_year_id)::int,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT unnest(sqlc.arg(student_ids)::int[]) AS student_id, unnest(sqlc.arg(form_levels)::int[]) AS form_level,
        unnest(sqlc.arg(statuses)::text[]) AS status
) u
WHERE s.id = u.student_id;

-- name: ListYearLearners :many
-- Learners who were at a school in an academic year (a year-end result or any marks
-- there), with the form they were in that year. Used to correct a finished year, so it
-- includes learners who have since completed Form 4, left or moved school.
SELECT s.id, s.student_number, s.first_name, COALESCE(s.middle_name, '')::text AS middle_name, s.last_name,
    COALESCE(s.gender, '')::text AS gender, s.status,
    COALESCE(p.from_form, s.form_level, 1)::int AS year_form
FROM students s
    LEFT JOIN promotions p ON p.student_id = s.id AND p.academic_year_id = sqlc.arg(academic_year_id)::int
WHERE s.id IN (
        SELECT pr.student_id FROM promotions pr
        WHERE pr.school_id = sqlc.arg(school_id)::int AND pr.academic_year_id = sqlc.arg(academic_year_id)::int
        UNION
        SELECT m.student_id FROM student_marks m
        WHERE m.school_id = sqlc.arg(school_id)::int AND m.academic_year_id = sqlc.arg(academic_year_id)::int)
    AND (sqlc.narg(form_level)::int IS NULL OR COALESCE(p.from_form, s.form_level, 1) = sqlc.narg(form_level)::int)
ORDER BY s.last_name, s.first_name, s.id;

-- name: ListYearMarksForSchool :many
-- The marks a school recorded for some learners in one year and term.
SELECT m.id, m.student_id, m.subject_id, m.academic_year_id, m.term, m.mark, m.school_id, m.updated_at
FROM student_marks m
WHERE m.school_id = sqlc.arg(school_id)::int AND m.academic_year_id = sqlc.arg(academic_year_id)::int
    AND m.term = sqlc.arg(term)::int AND m.student_id = ANY(sqlc.arg(student_ids)::int[])
ORDER BY m.student_id, m.subject_id;
