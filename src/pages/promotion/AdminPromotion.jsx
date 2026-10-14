import { useCallback, useEffect, useState } from "react";

import { advanceAllSchools, getPromotionSettings, listStages, runAutomaticPromotion, savePromotionSettings } from "../../api/promotion";
import { listSubjects } from "../../api/subjects";
import { getReminderSettings, saveReminderSettings, sendRemindersNow } from "../../api/academicYears";
import { formatDate } from "../../utils/format";
import useAsync from "../../hooks/useAsync";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import TypeToConfirm from "../../components/TypeToConfirm";
import { Badge, Button, Card, Field, IconButton, Input, Notice, Page, SearchInput, Switch, Table } from "../../components/ui";

const RUN_PHRASE = "promote all schools";

// MCDE's view of the school year: how promotion works, where every school is, and
// moving many schools at once.
export default function AdminPromotion() {
  const settings = useAsync(useCallback(() => getPromotionSettings(), []));
  const stages = useAsync(useCallback(() => listStages(), []));
  const subjects = useAsync(useCallback(() => listSubjects(), []));
  const blankRules = { automatic: false, subjects_to_pass: 6, jce_subjects_to_pass: 6, msce_subjects_to_pass: 6, jce_compulsory_ids: [], msce_compulsory_ids: [] };
  const [form, setForm] = useState(blankRules);
  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState(null); // term to move all schools from
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const notify = (message, variant = "success") => setToast({ show: true, message, variant });

  const fromSettings = (d) => ({
    automatic: d.automatic,
    subjects_to_pass: d.subjects_to_pass,
    jce_subjects_to_pass: d.jce_subjects_to_pass,
    msce_subjects_to_pass: d.msce_subjects_to_pass,
    jce_compulsory_ids: d.jce_compulsory.map((s) => s.id).sort(),
    msce_compulsory_ids: d.msce_compulsory.map((s) => s.id).sort(),
  });
  useEffect(() => {
    if (settings.data) setForm(fromSettings(settings.data));
  }, [settings.data]);
  const toggleCompulsory = (exam, id) =>
    setForm((f) => {
      const key = `${exam}_compulsory_ids`;
      const ids = f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id];
      return { ...f, [key]: ids.sort() };
    });

  const all = stages.data || [];
  const inTerm = (term) => all.filter((s) => s.term === term).length;
  // Schools in a term that has ended, so they may move on
  const readyIn = (term) => all.filter((s) => s.term === term && s.can_move_on).length;
  const term = search.trim().toLowerCase();
  const visible = all.filter((s) => `${s.school_name} ${s.district_name} ${s.region_name}`.toLowerCase().includes(term));
  const normalised = (f) => JSON.stringify({ ...f, subjects_to_pass: Number(f.subjects_to_pass), jce_subjects_to_pass: Number(f.jce_subjects_to_pass), msce_subjects_to_pass: Number(f.msce_subjects_to_pass) });
  const dirty = settings.data && normalised(form) !== normalised(fromSettings(settings.data));

  const run = async (action, after) => {
    setBusy(true);
    setError("");
    try {
      after(await action());
      stages.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = () =>
    run(
      () =>
        savePromotionSettings({
          ...form,
          subjects_to_pass: Number(form.subjects_to_pass),
          jce_subjects_to_pass: Number(form.jce_subjects_to_pass),
          msce_subjects_to_pass: Number(form.msce_subjects_to_pass),
        }),
      () => {
        settings.reload();
        notify("Promotion settings saved.");
      }
    );
  const moveAll = () => {
    const from = moving;
    setMoving(null);
    run(() => advanceAllSchools(from), ({ moved }) => notify(`${moved} school${moved === 1 ? "" : "s"} moved to Term ${from + 1}.`));
  };
  const runAutomatic = () => {
    setRunning(false);
    run(() => runAutomaticPromotion(), (summaries) => setReport(summaries));
  };

  return (
    <Page
      icon="bi-mortarboard"
      title="Promotion"
      subtitle="Terms are stages: schools move from Term 1 to 3, and Term 3 decides whether learners move up."
      stats={[
        ...[1, 2, 3].map((t) => ({ label: `In Term ${t}`, value: stages.loading ? null : inTerm(t) })),
        { label: "Term ended", value: stages.loading ? null : all.filter((s) => s.days_overdue > 0).length },
      ]}
      actions={
        <Button
          variant="ghost"
          icon="bi-bell"
          onClick={() =>
            run(
              () => sendRemindersNow(),
              (r) => {
                const total = Object.values(r.sent).reduce((a, b) => a + b, 0);
                notify(total ? `${total} reminder${total === 1 ? "" : "s"} sent.` : "No reminders were due: each one is sent once, on its day.");
              }
            )
          }
          disabled={busy}
        >
          Send reminders now
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      {error && <Notice tone="red">{error}</Notice>}

      <Card accent="purple" icon="bi-sliders" title="How promotion works" subtitle="Applies to every school">
        <DataState loading={settings.loading} error={settings.error} onRetry={settings.reload}>
          <div className="ui-grid ui-cols-2">
            <Field label="Form 1 and 3: subjects to pass in Term 3" hint="Learners passing at least this many subjects move up">
              <Input
                type="number"
                min={1}
                max={20}
                value={form.subjects_to_pass}
                onChange={(e) => setForm((f) => ({ ...f, subjects_to_pass: e.target.value }))}
              />
            </Field>
            <Field
              label="Promotion"
              hint={
                form.automatic
                  ? "MCDE finishes the year for every school in Term 3 at once; passing learners move up automatically."
                  : "Each school's coordinator reviews and finishes their own school's year."
              }
            >
              <Switch checked={form.automatic} onChange={(automatic) => setForm((f) => ({ ...f, automatic }))}>
                {form.automatic ? "Automatic" : "Manual (by each coordinator)"}
              </Switch>
            </Field>
          </div>
          <div className="ui-grid ui-cols-2 mt-3">
            {[
              { exam: "jce", label: "Form 2: JCE", hint: "Term 3 marks are the JCE results" },
              { exam: "msce", label: "Form 4: MSCE", hint: "Term 3 marks are the MSCE results" },
            ].map(({ exam, label, hint }) => (
              <Field key={exam} label={`${label} (MANEB rule)`} hint={hint}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize: 14, color: "var(--ui-text-body)" }}>Pass</span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    style={{ width: 80 }}
                    value={form[`${exam}_subjects_to_pass`]}
                    aria-label={`${label}: subjects to pass`}
                    onChange={(e) => setForm((f) => ({ ...f, [`${exam}_subjects_to_pass`]: e.target.value }))}
                  />
                  <span style={{ fontSize: 14, color: "var(--ui-text-body)" }}>subjects, including every subject ticked:</span>
                </div>
                <div className="d-flex flex-wrap gap-3">
                  {(subjects.data || []).map((sub) => (
                    <label key={sub.id} className="d-flex align-items-center gap-1" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
                      <input
                        type="checkbox"
                        checked={form[`${exam}_compulsory_ids`].includes(sub.id)}
                        onChange={() => toggleCompulsory(exam, sub.id)}
                      />
                      {sub.name}
                    </label>
                  ))}
                </div>
              </Field>
            ))}
          </div>
          <ul className="mt-3 mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)", lineHeight: 1.6 }}>
            <li>Failed Form 1 or Form 3: repeat is recommended; the learner can be allowed to move up.</li>
            <li>Failed Form 2 (JCE: the subjects above including the compulsory ones): repeats Form 2.</li>
            <li>Form 4: passing completes school; failing re-enrols in Form 4 to rewrite the national exams.</li>
          </ul>
          <div className="d-flex mt-3">
            <Button className="ms-auto" icon="bi-check-lg" onClick={saveSettings} disabled={!dirty || busy}>
              Save settings
            </Button>
          </div>
        </DataState>
      </Card>

      <ReminderSettingsCard notify={notify} />

      <Card
        accent="blue"
        icon="bi-building"
        title="Schools"
        subtitle="Where each open school is in the year"
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setMoving(1)} disabled={busy || !readyIn(1)}>
              All Term 1 → 2
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMoving(2)} disabled={busy || !readyIn(2)}>
              All Term 2 → 3
            </Button>
            {settings.data?.automatic && (
              <Button size="sm" variant="danger" icon="bi-lightning" onClick={() => setRunning(true)} disabled={busy || !inTerm(3)}>
                Finish year for all in Term 3
              </Button>
            )}
            <SearchInput value={search} onChange={setSearch} placeholder="Search schools…" />
          </>
        }
        flush
      >
        <DataState loading={stages.loading} error={stages.error} onRetry={stages.reload} empty={!visible.length}>
          <Table>
            <thead>
              <tr>
                <th>School</th>
                <th>District</th>
                <th className="num">Learners</th>
                <th>Year</th>
                <th>Term</th>
                <th className="end">Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.school_id}>
                  <td>
                    <div className="strong">{s.school_name}</div>
                    <div className="ui-hint">{s.school_number}</div>
                  </td>
                  <td>
                    {s.district_name}
                    <div className="ui-hint">{s.region_name}</div>
                  </td>
                  <td className="num">{s.learners}</td>
                  <td>{s.year}</td>
                  <td>
                    <Badge tone={s.term === 3 ? "purple" : "blue"}>Term {s.term}</Badge>
                    {s.days_overdue > 0 ? (
                      <div>
                        <Badge tone="red">Ended {s.days_overdue}d ago</Badge>
                      </div>
                    ) : (
                      s.term_end_date && <div className="ui-hint">ends {formatDate(s.term_end_date, { day: "numeric", month: "short" })}</div>
                    )}
                    {s.term === 3 && !s.next_year && <div className="ui-hint">{s.year + 1} not created</div>}
                  </td>
                  <td className="end">
                    <IconButton
                      kind="view"
                      icon="bi-arrow-right"
                      title={`Open terms and promotion for ${s.school_name}`}
                      tip={s.term === 3 ? "Year-end promotion" : "Terms and promotion"}
                      to={`/admin/promotion/${s.school_id}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>

      {report && (
        <Card accent="green" icon="bi-clipboard-check" title="Automatic promotion results" actions={<Button size="sm" variant="ghost" onClick={() => setReport(null)}>Close</Button>}>
          {report.length === 0 && <div>No schools were in Term 3.</div>}
          <ul className="mb-0">
            {report.map((r) => {
              const school = all.find((s) => s.school_id === r.school_id);
              return (
                <li key={r.school_id}>
                  {r.error ? (
                    <span className="text-danger">{r.error}</span>
                  ) : (
                    <>
                      <strong>{school?.school_name || `School ${r.school_id}`}</strong>:{" "}
                      {Object.entries(r.outcomes).map(([o, n]) => `${n} ${o}`).join(", ") || "no learners"}; now in {r.next_year}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <ConfirmModal
        show={!!moving}
        onHide={() => setMoving(null)}
        onConfirm={moveAll}
        danger={false}
        title={`Move all schools to Term ${(moving || 0) + 1}`}
        confirmLabel="Move schools"
        body={
          moving &&
          `Move the ${readyIn(moving)} schools whose Term ${moving} has ended to Term ${moving + 1}? Each school's Term ${moving} report is saved as it moves.${
            readyIn(moving) < inTerm(moving) ? ` ${inTerm(moving) - readyIn(moving)} school(s) whose term has not ended stay where they are.` : ""
          }`
        }
      />
      <TypeToConfirm
        show={running}
        name={RUN_PHRASE}
        title="Finish the year for all schools"
        confirmLabel="Finish the year"
        onHide={() => setRunning(false)}
        onConfirm={runAutomatic}
      >
        For all {inTerm(3)} schools in Term 3, this records every learner&apos;s result and moves them using the recommended
        outcomes: passing learners move up, Form 4 passers complete, and failing learners repeat (Form 4: rewrite).
        Coordinators can then allow failed Form 1 and Form 3 learners to move up during Term 1. Schools whose next academic
        year does not exist are skipped.
      </TypeToConfirm>
    </Page>
  );
}

// When term reminders go out. Term dates themselves are set per academic year.
function ReminderSettingsCard({ notify }) {
  const settings = useAsync(useCallback(() => getReminderSettings(), []));
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const dirty = form && settings.data && ["days_before", "overdue_after", "escalate_after"].some((k) => Number(form[k]) !== settings.data[k]);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await saveReminderSettings({
        days_before: Number(form.days_before),
        overdue_after: Number(form.overdue_after),
        escalate_after: Number(form.escalate_after),
      });
      settings.reload();
      notify("Reminder settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const text = { fontSize: 14, color: "var(--ui-text-body)" };
  return (
    <Card
      accent="amber"
      icon="bi-bell"
      title="Term reminders"
      subtitle="Sent automatically to schools still in a term, using the term dates on Manage → Academic Years"
    >
      <DataState loading={settings.loading} error={settings.error} onRetry={settings.reload}>
        {form && (
          <div className="ui-grid">
            <div className="ui-grid ui-cols-3">
              <Field label="First reminder" hint="days before the term ends">
                <Input type="number" min={1} max={60} value={form.days_before} onChange={set("days_before")} />
              </Field>
              <Field label="Urgent reminder" hint="days after the term ends">
                <Input type="number" min={1} max={60} value={form.overdue_after} onChange={set("overdue_after")} />
              </Field>
              <Field label="Tell the division office" hint="days after the term ends (one summary per division)">
                <Input type="number" min={2} max={90} value={form.escalate_after} onChange={set("escalate_after")} />
              </Field>
            </div>
            <p className="mb-0" style={text}>
              Schools are also reminded on the day their term ends. Each reminder is sent once per school and term, and stops
              when the school moves on.
            </p>
            {error && <Notice tone="red">{error}</Notice>}
            <div className="d-flex">
              <Button className="ms-auto" icon="bi-check-lg" onClick={save} disabled={!dirty || busy}>
                Save reminder settings
              </Button>
            </div>
          </div>
        )}
      </DataState>
    </Card>
  );
}
