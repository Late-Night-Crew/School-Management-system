-- +goose Up
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_school INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    to_school INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    date_initiated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_accepted TIMESTAMP,
    reason TEXT,
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_transfers_student_id ON transfers(student_id);

CREATE INDEX IF NOT EXISTS idx_transfers_from_school ON transfers(from_school);

CREATE INDEX IF NOT EXISTS idx_transfers_to_school ON transfers(to_school);

-- +goose Down
DROP INDEX IF EXISTS idx_transfers_student_id;

DROP INDEX IF EXISTS idx_transfers_from_school;

DROP INDEX IF EXISTS idx_transfers_to_school;

DROP TABLE IF EXISTS transfers;