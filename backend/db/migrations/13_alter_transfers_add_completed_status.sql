-- +goose Up
-- Finalizing an accepted transfer moves it to 'Completed', which the original check constraint did not allow.
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_status_check;

ALTER TABLE transfers
ADD CONSTRAINT transfers_status_check CHECK (
    status IN ('Pending', 'Accepted', 'Rejected', 'Completed')
);

-- +goose Down
UPDATE transfers SET status = 'Accepted' WHERE status = 'Completed';

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_status_check;

ALTER TABLE transfers
ADD CONSTRAINT transfers_status_check CHECK (
    status IN ('Pending', 'Accepted', 'Rejected')
);
