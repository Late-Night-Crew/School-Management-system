import { useCallback, useEffect, useState } from "react";

import { advanceTerm, allowToProceed, applyYearEnd, getStage, getYearEnd, getYearResults } from "../../api/promotion";
import useAsync from "../../hooks/useAsync";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import TypeToConfirm from "../../components/TypeToConfirm";
import { Badge, Button, Card, Notice, Select, StatTile, Table } from "../../components/ui";
import { OUTCOMES, outcomeLabel } from "./shared";
import { formatDate } from "../../utils/format";

const FORMS = [1, 2, 3, 4];

// One school's term and year end, for its coordinator or for MCDE. `base` is the
// school's promotion API path (see api/promotion schoolPromotionBase).
export default function YearEndPanel({ base, schoolName, onChanged = () => {}, notify }) {
  const stage = useAsync(useCallback(() => getStage(base), [base]));
  const results = useAsync(useCallback(() => getYearResults(base), [base]));
  const [confirmTerm, setConfirmTerm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reloadAll = () => {
    stage.reload();
    results.reload();
    onChanged();
  };

  const moveTerm = async () => {
    setConfirmTerm(false);
    setBusy(true);
    setError("");
    try {
      const next = await advanceTerm(base);
      notify(`${schoolName} is now in Term ${next.term}.`);
      reloadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const s = stage.data;
  return (
    <DataState loading={stage.loading} error={stage.error} onRetry={stage.reload}>
      {s && (
        <>
          <Card
            accent="blue"
            icon="bi-calendar3-range"
            title={`${s.year} · Term ${s.term}`}
            subtitle={
              s.term < 3
                ? `Learners move to Term ${s.term + 1} together, whatever their marks. Term 3 decides the year.`
                : "Term 3 decides the year: finish it below once Term 3 marks are entered."
            }
            actions={
              s.term < 3 && (
                <Button icon="bi-arrow-right-circle" onClick={() => setConfirmTerm(true)} disabled={busy || !s.can_move_on}>
                  Move to Term {s.term + 1}
                </Button>
              )
            }
          >
            <div className="ui-grid ui-cols-3">
              {[1, 2, 3].map((term) => (
                <StatTile
                  key={term}
                  label={term < s.term ? "Done" : term === s.term ? "Current term" : "Coming"}
                  value={`Term ${term}`}
                  icon={term < s.term ? "bi-check-circle" : term === s.term ? "bi-play-circle" : "bi-circle"}
                  tone={term < s.term ? "green" : term === s.term ? "blue" : "slate"}
                />
              ))}
            </div>
            {!s.term_end_date && (
              <Notice tone="amber">
                MCDE has not set the dates of {s.year} Term {s.term} yet. The school can move on once they are set and the term
                has ended.
              </Notice>
            )}
            {s.term_end_date && !s.days_overdue && (
              <p className="mt-3 mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
                Term {s.term} runs {formatDate(s.term_start_date)} to {formatDate(s.term_end_date)}.{" "}
                {s.can_move_on
                  ? "It ends today, so the school can move on."
                  : `The school can ${s.term < 3 ? `move to Term ${s.term + 1}` : "finish the year"} from ${formatDate(s.term_end_date)}.`}
              </p>
            )}
            {s.days_overdue > 0 && (
              <Notice tone="amber">
                Term {s.term} ended on {formatDate(s.term_end_date)} ({s.days_overdue} day{s.days_overdue === 1 ? "" : "s"} ago). Finish
                entering marks and {s.term < 3 ? `move to Term ${s.term + 1}` : "finish the year-end promotion"}.
              </Notice>
            )}
            {error && <Notice tone="red">{error}</Notice>}
          </Card>

          {s.term === 3 && <YearEnd base={base} stage={s} schoolName={schoolName} notify={notify} onDone={reloadAll} />}

          <LastYearResults results={results} base={base} notify={notify} onChanged={reloadAll} />

          <ConfirmModal
            show={confirmTerm}
            onHide={() => setConfirmTerm(false)}
            onConfirm={moveTerm}
            danger={false}
            title={`Move to Term ${s.term + 1}`}
            confirmLabel={`Move to Term ${s.term + 1}`}
            body={`Move ${schoolName} from Term ${s.term} to Term ${s.term + 1} of ${s.year}? Marks for Term ${s.term} can still be corrected afterwards.`}
          />
        </>
      )}
    </DataState>
  );
}

// The year-end review: each learner's Term 3 result, the recommended outcome and,
// where the rules allow a choice, a way to change it.
function YearEnd({ base, stage, schoolName, notify, onDone }) {
  const preview = useAsync(useCallback(() => getYearEnd(base), [base]));
  const [choices, setChoices] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setChoices({}), [preview.data]);

  const p = preview.data;
  const learners = p?.learners || [];
  const outcomeFor = (l) => choices[l.student_id] || l.recommended;
  const counts = learners.reduce((acc, l) => ({ ...acc, [outcomeFor(l)]: (acc[outcomeFor(l)] || 0) + 1 }), {});
  const missingMarks = learners.filter((l) => l.subjects_marked === 0).length;

  const apply = async () => {
    setConfirming(false);
    setBusy(true);
    setError("");
    try {
      const decisions = Object.entries(choices).map(([id, outcome]) => ({ student_id: Number(id), outcome }));
      const summary = await applyYearEnd(base, decisions);
      notify(`${schoolName} finished ${stage.year}. Learners are now in Term 1 of ${summary.next_year}.`);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      accent="purple"
      icon="bi-mortarboard"
      title={`Year-end promotion ${stage.year}`}
      subtitle={
        p
          ? `Term 3 decides (pass mark ${p.pass_mark}). Forms 1 and 3 need ${p.subjects_to_pass} subjects; Forms 2 and 4 follow the JCE and MSCE rules, including compulsory subjects.`
          : ""
      }
      flush
    >
      <DataState loading={preview.loading} error={preview.error} onRetry={preview.reload}>
        {p && (
          <>
            <div style={{ padding: "0 20px" }} className="ui-grid">
              {!stage.can_move_on && stage.term_end_date && (
                <Notice tone="blue">
                  You can review the results now. The year can be finished once Term 3 ends on {formatDate(stage.term_end_date)}.
                </Notice>
              )}
              {!stage.next_year && (
                <Notice tone="amber">
                  The {stage.year + 1} academic year has not been created yet. MCDE creates it under Manage → Academic Years;
                  learners move into it.
                </Notice>
              )}
              {p.automatic && (
                <Notice tone="blue">
                  Automatic promotion is on: MCDE can finish the year for every school at once. You can still finish it for
                  this school here, and decide for Form 1 and Form 3 learners who failed.
                </Notice>
              )}
              {missingMarks > 0 && (
                <Notice tone="amber">
                  {missingMarks} learner{missingMarks === 1 ? " has" : "s have"} no Term 3 marks, so they count as failed. Enter
                  Term 3 marks first if that is not right.
                </Notice>
              )}
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(counts).map(([outcome, n]) => (
                  <Badge key={outcome} tone={OUTCOMES[outcome]?.tone}>
                    {n} · {outcomeLabel(outcome)}
                  </Badge>
                ))}
              </div>
            </div>
            <Table compact>
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Form</th>
                  <th className="num">Subjects passed</th>
                  <th>Result</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {learners.length === 0 && (
                  <tr>
                    <td colSpan={5}>No learners are waiting for a result.</td>
                  </tr>
                )}
                {FORMS.flatMap((form) =>
                  learners
                    .filter((l) => l.form_level === form)
                    .map((l) => (
                      <tr key={l.student_id}>
                        <td>
                          <div className="strong">{l.name}</div>
                          <div className="ui-hint">{l.student_number}</div>
                        </td>
                        <td>Form {l.form_level}</td>
                        <td className="num">
                          {l.subjects_passed} of {l.subjects_marked}
                          <div className="ui-hint">needs {l.subjects_needed}</div>
                        </td>
                        <td>
                          <Badge tone={l.passed ? "green" : "red"}>{l.passed ? "Passed" : "Failed"}</Badge>
                          {l.missed_compulsory && <div className="ui-hint">A compulsory {l.form_level === 2 ? "JCE" : "MSCE"} subject not passed</div>}
                        </td>
                        <td>
                          {l.allowed.length > 1 ? (
                            <Select
                              value={outcomeFor(l)}
                              aria-label={`Outcome for ${l.name}`}
                              onChange={(e) => setChoices((c) => ({ ...c, [l.student_id]: e.target.value }))}
                            >
                              {l.allowed.map((o) => (
                                <option key={o} value={o}>
                                  {outcomeLabel(o)}
                                  {o === l.recommended ? " (recommended)" : ""}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Badge tone={OUTCOMES[l.recommended]?.tone}>{outcomeLabel(l.recommended)}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </Table>
            <div style={{ padding: "16px 20px" }} className="d-flex flex-wrap align-items-center gap-3">
              {error && <Notice tone="red">{error}</Notice>}
              <Button
                icon="bi-check2-all"
                className="ms-auto"
                onClick={() => setConfirming(true)}
                disabled={busy || !stage.next_year || !stage.can_move_on}
              >
                {busy ? "Finishing…" : `Finish ${stage.year} and start ${stage.next_year || stage.year + 1}`}
              </Button>
            </div>
          </>
        )}
      </DataState>
      <TypeToConfirm
        show={confirming}
        name={schoolName}
        title="Finish the school year"
        confirmLabel="Finish the year"
        onHide={() => setConfirming(false)}
        onConfirm={apply}
      >
        This records every learner&apos;s result for {stage.year}, moves them to their new form and puts{" "}
        <strong>{schoolName}</strong> in Term 1 of {stage.next_year}:{" "}
        {Object.entries(counts)
          .map(([o, n]) => `${n} ${outcomeLabel(o).toLowerCase()}`)
          .join(", ")}
        . Afterwards, only Form 1 and Form 3 learners who repeat can still be allowed to move up, during Term 1.
      </TypeToConfirm>
    </Card>
  );
}

// Last year's results, where a Form 1 or 3 learner who failed can still be allowed up.
function LastYearResults({ results, base, notify, onChanged }) {
  const [proceeding, setProceeding] = useState(null);
  const [error, setError] = useState("");
  const data = results.data;
  if (!data || !data.results.length) return null;

  const proceed = async () => {
    const learner = proceeding;
    setProceeding(null);
    setError("");
    try {
      await allowToProceed(base, learner.student_id);
      notify(`${learner.name} moves up to Form ${learner.from_form + 1}.`);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card accent="slate" icon="bi-clipboard-check" title={`Results for ${data.year}`} subtitle={`${data.results.length} learners`} flush>
      {error && (
        <div style={{ padding: "0 20px" }}>
          <Notice tone="red">{error}</Notice>
        </div>
      )}
      <Table compact>
        <thead>
          <tr>
            <th>Learner</th>
            <th>Form</th>
            <th className="num">Subjects passed</th>
            <th>Outcome</th>
            <th>Decided by</th>
            <th className="end">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.results.map((r) => (
            <tr key={r.student_id}>
              <td className="strong">{r.name}</td>
              <td>
                {r.from_form === r.to_form ? `Form ${r.from_form}` : `Form ${r.from_form} → ${r.to_form}`}
              </td>
              <td className="num">{r.subjects_passed}</td>
              <td>
                <Badge tone={OUTCOMES[r.outcome]?.tone}>{outcomeLabel(r.outcome)}</Badge>
              </td>
              <td>{r.automatic ? "Automatic" : r.decided_by_name}</td>
              <td className="end">
                {r.can_proceed && (
                  <Button size="sm" variant="ghost" icon="bi-arrow-up-circle" onClick={() => setProceeding(r)}>
                    Allow to move up
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ConfirmModal
        show={!!proceeding}
        onHide={() => setProceeding(null)}
        onConfirm={proceed}
        danger={false}
        title="Allow to move up"
        confirmLabel={proceeding ? `Move to Form ${proceeding.from_form + 1}` : "Move up"}
        body={
          proceeding &&
          `${proceeding.name} passed ${proceeding.subjects_passed} subjects in Form ${proceeding.from_form}, so repeating was recommended. Allow them to move up to Form ${proceeding.from_form + 1} anyway?`
        }
      />
    </Card>
  );
}
