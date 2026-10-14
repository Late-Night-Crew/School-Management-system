-- +goose Up
-- Learners who leave. Besides Active and Completed (finished Form 4), a learner can be
-- Withdrawn (formally left) or DroppedOut (stopped coming), with the date they left and
-- an optional reason, since many just stop coming without one. They keep their records
-- but leave marks entry, promotion, transfers and the counts; they can be reinstated.
-- Status was free text before; anything unexpected becomes Active.
UPDATE students SET status = 'Active'
WHERE status IS NULL OR status NOT IN ('Active', 'Completed');

ALTER TABLE students
    ALTER COLUMN status SET DEFAULT 'Active',
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT students_status_check CHECK (status IN ('Active', 'Withdrawn', 'DroppedOut', 'Completed')),
    ADD COLUMN IF NOT EXISTS left_on DATE,
    ADD COLUMN IF NOT EXISTS leaving_reason TEXT;

-- +goose Down
ALTER TABLE students
    DROP CONSTRAINT IF EXISTS students_status_check,
    ALTER COLUMN status DROP NOT NULL,
    DROP COLUMN IF EXISTS left_on,
    DROP COLUMN IF EXISTS leaving_reason;
