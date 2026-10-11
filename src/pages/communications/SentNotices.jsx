import { useCallback, useEffect, useState } from "react";

import { listNoticeRecipients, listSentNotices, previewAudience, remindPending, sendNotice, withdrawNotice } from "../../api/comms";
import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import { ROLES } from "../../auth/session";
import DataState from "../../components/DataState";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import { Badge, Button, Card, Dialog, Field, Input, Notice, Segmented, Select, Table, Textarea } from "../../components/ui";
import { DATE_TIME, isOverdue, todayISO } from "./shared";
import styles from "./Communications.module.css";

// Notices sent by the signed-in user's office, with how many recipients have read
// them and, for notices with a due date, marked them done.
export default function SentNotices({ refreshKey, onAlert }) {
  const { data, loading, error, reload } = useAsync(
    // refreshKey reloads the list after a new notice is sent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => listSentNotices(), [refreshKey])
  );
  const notices = data || [];
  const [selected, setSelected] = useState(null);

  return (
    <Card accent="green" icon="bi-send" title="Sent Notices" subtitle="Track who has read each notice and who has completed it" flush>
      <DataState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        empty={notices.length === 0}
        emptyIcon="bi-send"
        emptyMessage="You have not sent any notices yet. Use New notice to send one."
      >
        <Table>
          <thead>
            <tr>
              <th>Notice</th>
              <th>Sent to</th>
              <th>Sent</th>
              <th>Due</th>
              <th>Progress</th>
              <th className="end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((n) => (
              <tr key={n.id}>
                <td>
                  <div className="strong">{n.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {n.priority === "Urgent" && <Badge tone="red">Urgent</Badge>}
                    {n.reminder_of ? <Badge tone="purple">Reminder</Badge> : null}
                    {n.withdrawn_at && <Badge tone="slate">Withdrawn</Badge>}
                  </div>
                </td>
                <td>{n.audience_label}</td>
                <td>
                  <div>{formatDate(n.created_at)}</div>
                  {n.sender_name && <div className={styles.muted}>by {n.sender_name}</div>}
                </td>
                <td>
                  {n.due_date ? (
                    <span style={{ whiteSpace: "nowrap" }}>
                      {formatDate(n.due_date)}
                      {isOverdue(n.due_date) && n.done_count < n.recipient_count && !n.withdrawn_at && (
                        <div>
                          <Badge tone="red">Overdue</Badge>
                        </div>
                      )}
                    </span>
                  ) : (
                    <span className={styles.muted}>None</span>
                  )}
                </td>
                <td>
                  <Progress label="Read" value={n.read_count} total={n.recipient_count} tone="blue" />
                  {n.due_date && <Progress label="Done" value={n.done_count} total={n.recipient_count} tone="green" />}
                </td>
                <td className="end">
                  <Button variant="ghost" size="sm" icon="bi-people" onClick={() => setSelected(n)}>
                    Recipients
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataState>

      {selected && (
        <RecipientsDialog
          notice={selected}
          onHide={() => setSelected(null)}
          onChanged={(message) => {
            onAlert(message);
            setSelected(null);
            reload();
          }}
        />
      )}
    </Card>
  );
}

function Progress({ label, value, total, tone }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className={styles.progress} style={{ marginBottom: 4 }}>
      <div className={styles.progressRow}>
        <span>{label}</span>
        <span
          className={styles.bar}
          role="progressbar"
          aria-label={`${label}: ${value} of ${total}`}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <span className={styles.barFill} style={{ width: `${percent}%`, background: `var(--tone-${tone}-line)` }} />
        </span>
        <span>
          {value}/{total}
        </span>
      </div>
    </div>
  );
}

const RECIPIENT_FILTERS = [
  { value: "pending", label: "Still pending" },
  { value: "all", label: "Everyone" },
];

// Per-recipient read/done status, with "remind pending" and "withdraw".
function RecipientsDialog({ notice, onHide, onChanged }) {
  const { data: recipients = [], loading, error, reload } = useAsync(
    useCallback(() => listNoticeRecipients(notice.id), [notice.id])
  );
  const [filter, setFilter] = useState("pending");
  const [withdrawing, setWithdrawing] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const pendingOf = (r) => (notice.due_date ? !r.done_at : !r.read_at);
  const pending = recipients.filter(pendingOf);
  const visible = filter === "pending" ? pending : recipients;
  const canAct = !notice.withdrawn_at;

  const run = async (action, message) => {
    setBusy(true);
    setActionError("");
    try {
      await action();
      onChanged(message);
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog show onHide={onHide} title={notice.title} icon="bi-people" size="lg">
      {notice.withdrawn_at && (
        <Notice tone="amber">
          Withdrawn on {formatDate(notice.withdrawn_at)}: {notice.withdrawn_reason}
        </Notice>
      )}
      <p className={styles.explain} style={{ whiteSpace: "pre-wrap" }}>
        {notice.body}
      </p>
      {actionError && <Notice tone="red">{actionError}</Notice>}

      {canAct && !withdrawing && (
        <div className={styles.dialogActions}>
          <Button
            icon="bi-bell"
            size="sm"
            disabled={busy || pending.length === 0}
            onClick={() =>
              run(() => remindPending(notice.id), `Reminder sent to ${pending.length} recipient${pending.length === 1 ? "" : "s"}.`)
            }
          >
            Remind {pending.length} pending
          </Button>
          <Button variant="ghost" size="sm" icon="bi-x-circle" onClick={() => setWithdrawing(true)}>
            Withdraw notice
          </Button>
        </div>
      )}

      {withdrawing && (
        <div style={{ marginBottom: 14 }}>
          <Field label="Why are you withdrawing it?" required hint="Recipients keep the notice but see it as withdrawn, with this reason.">
            <Textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </Field>
          <div className={styles.dialogActions} style={{ marginTop: 8 }}>
            <Button
              variant="danger"
              size="sm"
              disabled={busy || !reason.trim()}
              onClick={() => run(() => withdrawNotice(notice.id, reason.trim()), "Notice withdrawn.")}
            >
              Withdraw
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setWithdrawing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className={styles.recipientFilter}>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={RECIPIENT_FILTERS.map((f) => ({
            ...f,
            label: `${f.label} (${f.value === "pending" ? pending.length : recipients.length})`,
          }))}
        />
      </div>
      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={visible.length === 0}
        emptyIcon="bi-check2-all"
        emptyMessage="Everyone has acted on this notice."
      >
        <Table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Read</th>
              {notice.due_date && <th>Done</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.type}:${r.id}`}>
                <td>
                  <div>{r.label}</div>
                  {r.district_name && <div className={styles.muted}>{r.district_name}</div>}
                </td>
                <td>{r.read_at ? formatDate(r.read_at, DATE_TIME) : <Badge tone="slate">Not read</Badge>}</td>
                {notice.due_date && (
                  <td>
                    {r.done_at ? (
                      <>
                        <div>{formatDate(r.done_at, DATE_TIME)}</div>
                        {r.done_by_name && <div className={styles.muted}>by {r.done_by_name}</div>}
                      </>
                    ) : (
                      <Badge tone={isOverdue(notice.due_date) ? "red" : "amber"}>
                        {isOverdue(notice.due_date) ? "Overdue" : "Pending"}
                      </Badge>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </DataState>
    </Dialog>
  );
}

// Audience choices per sender. A regional admin's options are limited to their region.
const SUPER_AUDIENCES = [
  { value: "SCHOOLS_ALL", label: "All schools" },
  { value: "SCHOOLS_IN_REGION", label: "All schools in a region", target: "region" },
  { value: "SCHOOLS_IN_DISTRICT", label: "All schools in a district", target: "district" },
  { value: "SCHOOL", label: "One school", target: "school" },
  { value: "REGIONAL_ADMINS", label: "All regional admins" },
  { value: "REGIONAL_ADMIN", label: "One regional admin", target: "region" },
];
const REGIONAL_AUDIENCES = [
  { value: "SCHOOLS_IN_REGION", label: "All schools in my region" },
  { value: "SCHOOLS_IN_DISTRICT", label: "All schools in a district", target: "district" },
  { value: "SCHOOL", label: "One school", target: "school" },
];

export function NewNoticeDialog({ session, onHide, onSent }) {
  const isSuper = session.role === ROLES.SUPER_ADMIN;
  const ownRegionId = Number(session.regionId) || null;
  const audiences = isSuper ? SUPER_AUDIENCES : REGIONAL_AUDIENCES;

  const { data: places } = useAsync(useCallback(() => Promise.all([listRegions(), listDistricts(), listSchools()]), []));
  const [regions = [], allDistricts = [], allSchools = []] = places || [];
  // A regional admin only sees the districts and schools of their own region
  const districts = isSuper ? allDistricts : allDistricts.filter((d) => d.region_id === ownRegionId);
  const districtIds = new Set(districts.map((d) => d.id));
  const schools = isSuper ? allSchools : allSchools.filter((s) => districtIds.has(s.district_id));

  const [form, setForm] = useState({
    audience_type: audiences[0].value,
    audience_id: "",
    title: "",
    body: "",
    priority: "Normal",
    due_date: "",
  });
  const [count, setCount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const audience = audiences.find((a) => a.value === form.audience_type);
  // "All schools in my region" always targets the regional admin's own region
  const audienceId = audience.target ? form.audience_id : !isSuper && form.audience_type === "SCHOOLS_IN_REGION" ? ownRegionId : "";
  const targetChosen = !audience.target || Boolean(form.audience_id);

  // Preview how many recipients the chosen audience reaches
  useEffect(() => {
    if (!targetChosen) {
      setCount(null);
      return undefined;
    }
    let current = true;
    previewAudience(form.audience_type, audienceId).then(
      (result) => current && setCount(result.recipient_count),
      () => current && setCount(null)
    );
    return () => {
      current = false;
    };
  }, [form.audience_type, audienceId, targetChosen]);

  const update = (changes) => setForm((prev) => ({ ...prev, ...changes }));
  const valid = targetChosen && form.title.trim() && form.body.trim() && count > 0;
  const recipientWord = form.audience_type.startsWith("REGIONAL") ? "regional office" : "school";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      const sent = await sendNotice({
        audience_type: form.audience_type,
        audience_id: audienceId ? Number(audienceId) : undefined,
        title: form.title.trim(),
        body: form.body.trim(),
        priority: form.priority,
        due_date: form.due_date || undefined,
      });
      onSent(`Notice sent to ${sent.recipient_count} ${recipientWord}${sent.recipient_count === 1 ? "" : "s"}.`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const targetOptions = { region: regions, district: districts, school: schools }[audience.target] || [];

  return (
    <Dialog
      show
      onHide={onHide}
      title="New Notice"
      icon="bi-megaphone"
      size="lg"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" icon="bi-send" disabled={saving || !valid}>
            {saving
              ? "Sending…"
              : count
                ? `Send to ${count} ${recipientWord}${count === 1 ? "" : "s"}`
                : "Send"}
          </Button>
        </>
      }
    >
      {error && <Notice tone="red">{error}</Notice>}
      <div className="ui-grid ui-cols-2">
        <Field label="Send to" required>
          <Select value={form.audience_type} onChange={(e) => update({ audience_type: e.target.value, audience_id: "" })}>
            {audiences.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </Field>
        {audience.target ? (
          <Field label={{ region: "Region", district: "District", school: "School" }[audience.target]} required>
            <Select value={form.audience_id} onChange={(e) => update({ audience_id: e.target.value })}>
              <option value="">Choose…</option>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div />
        )}
        <div className={`ui-span-all ${styles.audiencePreview}`} aria-live="polite">
          {targetChosen && count != null && (
            <Notice tone={count > 0 ? "blue" : "amber"}>
              {count > 0
                ? `This notice will reach ${count} ${recipientWord}${count === 1 ? "" : "s"}. The list is fixed when you send it.`
                : "There is no one to send to in this audience."}
            </Notice>
          )}
        </div>
        <Field label="Title" required className="ui-span-all">
          <Input
            value={form.title}
            maxLength={200}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="e.g. Submit end of term reports"
          />
        </Field>
        <Field label="Message" required className="ui-span-all">
          <Textarea rows={6} maxLength={5000} value={form.body} onChange={(e) => update({ body: e.target.value })} />
        </Field>
        <Field label="Priority">
          <Segmented
            value={form.priority}
            onChange={(priority) => update({ priority })}
            options={[
              { value: "Normal", label: "Normal" },
              { value: "Urgent", label: "Urgent" },
            ]}
          />
        </Field>
        <Field label="Due date" hint="Optional. Recipients mark the notice done, and you can see who has not.">
          <Input type="date" min={todayISO()} value={form.due_date} onChange={(e) => update({ due_date: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  );
}
