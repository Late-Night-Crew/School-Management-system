-- +goose Up
-- Term dates and reminders to schools. MCDE sets when each term of an academic year
-- starts and ends; a daily check reminds every school still in a term that it is about
-- to end (7 days before), that it has ended, and again a week later. Two weeks after the
-- end, the school's division office is told the school is overdue. Reminders are
-- automatic notices in the schools' (and divisions') inboxes.
CREATE TABLE IF NOT EXISTS academic_year_terms (
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term INT NOT NULL CHECK (term BETWEEN 1 AND 3),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date >= start_date),
    PRIMARY KEY (academic_year_id, term)
);

-- Which reminders have gone out, so each is sent once per school and term.
-- kind: ending | ended | overdue | escalated (to the division office)
CREATE TABLE IF NOT EXISTS term_reminders (
    school_id INT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term INT NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('ending', 'ended', 'overdue', 'escalated')),
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (school_id, academic_year_id, term, kind)
);

-- +goose Down
DROP TABLE IF EXISTS term_reminders;

DROP TABLE IF EXISTS academic_year_terms;
