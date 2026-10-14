import { useEffect, useState } from "react";

import { setTermDates } from "../../api/academicYears";
import { Button, Dialog, Field, Input, Notice } from "../../components/ui";
import { formatDate } from "../../utils/format";

const TERMS = [1, 2, 3];

// Sets when each term of an academic year starts and ends. Schools are reminded a week
// before their term ends, when it ends and a week later; their division office is told
// if they are still in the term two weeks after it ended.
export default function TermDatesDialog({ year, dates, onHide, onSaved }) {
  const [rows, setRows] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!year) return;
    const own = Object.fromEntries(
      TERMS.map((t) => {
        const d = dates.find((x) => x.academic_year_id === year.id && x.term === t);
        return [t, { start_date: d?.start_date || "", end_date: d?.end_date || "" }];
      })
    );
    setRows(own);
    setError("");
  }, [year, dates]);

  const set = (term, field) => (e) => setRows((r) => ({ ...r, [term]: { ...r[term], [field]: e.target.value } }));

  const save = async (e) => {
    e.preventDefault();
    const terms = TERMS.filter((t) => rows[t]?.start_date || rows[t]?.end_date).map((t) => ({ term: t, ...rows[t] }));
    if (terms.some((t) => !t.start_date || !t.end_date)) {
      setError("Give both a start and an end date for each term you fill in.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await setTermDates(year.id, terms);
      onSaved(`Term dates for ${year.year} saved.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      show={!!year}
      onHide={onHide}
      title={year ? `Term dates for ${year.year}` : "Term dates"}
      icon="bi-calendar3-range"
      as="form"
      onSubmit={save}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" icon="bi-check-lg" disabled={busy}>
            {busy ? "Saving…" : "Save term dates"}
          </Button>
        </>
      }
    >
      {year && (
        <div className="ui-grid">
          <div className="ui-hint">
            The year runs from {formatDate(year.start_date)} to {formatDate(year.end_date)}. Schools get a reminder in their
            notifications a week before their term ends, when it ends and a week later; after two weeks their division office
            is told.
          </div>
          {TERMS.map((t) => (
            <div key={t} className="ui-grid ui-cols-2">
              <Field label={`Term ${t} starts`}>
                <Input type="date" min={year.start_date} max={year.end_date} value={rows[t]?.start_date || ""} onChange={set(t, "start_date")} />
              </Field>
              <Field label={`Term ${t} ends`}>
                <Input type="date" min={year.start_date} max={year.end_date} value={rows[t]?.end_date || ""} onChange={set(t, "end_date")} />
              </Field>
            </div>
          ))}
          {error && <Notice tone="red">{error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}
