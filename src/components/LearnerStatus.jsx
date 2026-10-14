import { useEffect, useState } from "react";

import ConfirmModal from "./ConfirmModal";
import { Badge, Button, Dialog, Field, Input, Notice, Segmented, Textarea } from "./ui";
import { formatDate } from "../utils/format";

// Learner statuses (see backend migration 29) and how they are shown
const STATUS_LOOK = {
  Active: { label: "Current", tone: "green" },
  Withdrawn: { label: "Withdrawn", tone: "amber" },
  DroppedOut: { label: "Dropped out", tone: "red" },
  Completed: { label: "Completed Form 4", tone: "purple" },
};

export function LearnerStatusBadge({ student }) {
  const look = STATUS_LOOK[student.status] || { label: student.status, tone: "slate" };
  const tip = student.left_on ? `Left ${formatDate(student.left_on)}${student.leaving_reason ? `: ${student.leaving_reason}` : ""}` : undefined;
  return (
    <span title={tip}>
      <Badge tone={look.tone}>{look.label}</Badge>
    </span>
  );
}

const KINDS = [
  { value: "DroppedOut", label: "Dropped out" },
  { value: "Withdrawn", label: "Withdrawn" },
];

// Records that a learner left: dropped out (stopped coming) or withdrawn (formally left),
// the date, and an optional reason. markLeft(studentId, { status, left_on, reason }).
export function LeaveDialog({ student, onHide, onDone, markLeft }) {
  const [form, setForm] = useState({ status: "DroppedOut", left_on: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (student) {
      setForm({ status: "DroppedOut", left_on: today, reason: "" });
      setError("");
    }
  }, [student, today]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await markLeft(student.id, { ...form, reason: form.reason.trim() });
      onDone(`${student.first_name} ${student.last_name} is marked as ${form.status === "DroppedOut" ? "dropped out" : "withdrawn"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      show={!!student}
      onHide={onHide}
      title="Learner has left"
      icon="bi-box-arrow-right"
      as="form"
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon="bi-check-lg" disabled={busy || !form.left_on}>
            {busy ? "Saving…" : "Mark as left"}
          </Button>
        </>
      }
    >
      {student && (
        <div className="ui-grid">
          <p className="mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
            <strong>
              {student.first_name} {student.last_name}
            </strong>{" "}
            leaves marks entry, promotion and the school&apos;s counts. Their records are kept, and they can be reinstated if
            they come back. If they moved to another school, use a transfer instead.
          </p>
          <Field label="What happened">
            <Segmented options={KINDS} value={form.status} onChange={(status) => setForm((f) => ({ ...f, status }))} />
          </Field>
          <Field label="Date they left" required>
            <Input type="date" max={today} value={form.left_on} onChange={(e) => setForm((f) => ({ ...f, left_on: e.target.value }))} required />
          </Field>
          <Field label="Reason" hint="Optional: many learners stop coming without giving one">
            <Textarea rows={2} maxLength={500} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </Field>
          {error && <Notice tone="red">{error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}

// Brings a learner who left back as a current learner. reinstate(studentId).
export function ReinstateDialog({ student, onHide, onDone, reinstate, onError }) {
  return (
    <ConfirmModal
      show={!!student}
      onHide={onHide}
      danger={false}
      title="Reinstate learner"
      confirmLabel="Reinstate"
      onConfirm={async () => {
        try {
          await reinstate(student.id);
          onDone(`${student.first_name} ${student.last_name} is back as a current learner.`);
        } catch (err) {
          onError(err.message);
        }
      }}
      body={student && `${student.first_name} ${student.last_name} is back at school? They return to marks entry and promotion in Form ${student.form_level}.`}
    />
  );
}
