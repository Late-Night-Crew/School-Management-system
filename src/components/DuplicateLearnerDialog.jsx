import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import Notice from "./ui/Notice";
import Table from "./ui/Table";

// Shown before saving a learner who looks like someone already registered (same name
// and the same date of birth or guardian phone). Two learners can share a name, so
// this warns rather than blocks: the user checks and either goes back or saves anyway.
export default function DuplicateLearnerDialog({ matches, onCancel, onConfirm, busy = false }) {
  return (
    <Dialog
      show={!!matches?.length}
      onHide={onCancel}
      title="Possible duplicate learner"
      icon="bi-people"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Go back and check
          </Button>
          <Button variant="danger" icon="bi-check-lg" onClick={onConfirm} disabled={busy}>
            {busy ? "Saving…" : "It's a different learner, save"}
          </Button>
        </>
      }
    >
      <div className="ui-grid">
        <p className="mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
          {matches?.length === 1 ? "This learner" : "These learners"} may be the same person. If so, ask for a transfer from
          their current school instead of registering them again. Adding the learner&apos;s National ID tells records apart.
        </p>
        <Table compact>
          <thead>
            <tr>
              <th>Learner</th>
              <th>Student No.</th>
              <th>School</th>
              <th>Form</th>
              <th>Why it matched</th>
            </tr>
          </thead>
          <tbody>
            {(matches || []).map((m) => (
              <tr key={m.id}>
                <td className="strong">{m.name}</td>
                <td>{m.student_number}</td>
                <td>{m.school_name || "-"}</td>
                <td>{m.form_level ? `Form ${m.form_level}` : "-"}</td>
                <td>{m.reason}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {matches?.some((m) => m.has_national_id) && (
          <Notice tone="blue">If you have this learner&apos;s National ID, enter it: the system refuses an ID that is already registered.</Notice>
        )}
      </div>
    </Dialog>
  );
}
