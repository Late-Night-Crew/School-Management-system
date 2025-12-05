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
        last_name,
        date_of_birth,
        gender,
        form_level,
        guardian_name,
        previous_school,
        school_id,
        academic_year_id,
        status
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id,
    student_number,
    first_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    previous_school,
    school_id,
    academic_year_id,
    status,
    created_at,
    updated_at;

-- name: GetStudentByID :one
SELECT
    id,
    student_number,
    first_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    previous_school,
    school_id,
    academic_year_id,
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
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    previous_school,
    school_id,
    academic_year_id,
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
    last_name = $4,
    date_of_birth = $5,
    gender = $6,
    form_level = $7,
    guardian_name = $8,
    previous_school = $9,
    school_id = $10,
    academic_year_id = $11,
    status = $12,
    updated_at = NOW()
WHERE
    id = $1 RETURNING id,
    student_number,
    first_name,
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    previous_school,
    school_id,
    academic_year_id,
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
    last_name,
    date_of_birth,
    gender,
    form_level,
    guardian_name,
    previous_school,
    school_id,
    academic_year_id,
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
RETURNING id, student_id, from_school, to_school, status, date_initiated, reason;

-- name: GetTransfersByToSchoolID :many
SELECT
    id,
    student_id,
    from_school,
    to_school,
    status,
    date_initiated,
    date_accepted,
    reason
FROM
    transfers
WHERE
    to_school = $1;

-- name: GetTransferByID :one
SELECT
    id,
    student_id,
    from_school,
    to_school,
    status,
    date_initiated,
    date_accepted,
    reason
FROM
    transfers
WHERE
    id = $1;

-- name: ApproveTransfer :one
WITH updated_student AS (
    UPDATE students
    SET school_id = sqlc.arg(new_school_id)
    WHERE students.id = sqlc.arg(student_id)
    RETURNING students.id
)
UPDATE transfers
SET
    status = 'Accepted',
    date_accepted = CURRENT_TIMESTAMP
WHERE
    transfers.id = sqlc.arg(transfer_id)
RETURNING transfers.id, status, date_accepted;


-- name: FinalizeTransfer :one
UPDATE transfers
SET
    status = 'Completed'
WHERE
    transfers.id = $1
RETURNING transfers.id, status;