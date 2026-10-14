-- +goose Up
-- An academic year's status now follows its dates (Upcoming before it starts, Active
-- while it runs, Completed after it ends) instead of being set by hand, so a year a
-- school has moved into becomes Active on its start date without anyone remembering to
-- switch it. The app refreshes it hourly and whenever a year is saved; this brings
-- existing years in line.
UPDATE academic_years
SET status = CASE
        WHEN CURRENT_DATE < start_date THEN 'Upcoming'
        WHEN CURRENT_DATE > end_date THEN 'Completed'
        ELSE 'Active'
    END
WHERE status IS DISTINCT FROM CASE
        WHEN CURRENT_DATE < start_date THEN 'Upcoming'
        WHEN CURRENT_DATE > end_date THEN 'Completed'
        ELSE 'Active'
    END;

-- +goose Down
SELECT 1;
