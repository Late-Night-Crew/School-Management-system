import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  acceptSchoolRequest,
  deleteSchoolRequest,
  getSchoolRequest,
  notifySchoolRequestsChanged,
  submitSchoolRequest,
} from "../../api/schoolRequests";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import ToastNote from "../../components/ToastNote";
import TypeToConfirm from "../../components/TypeToConfirm";
import { Badge, Button, Card, Dialog, Field, Input, Notice, Page, Switch, Table } from "../../components/ui";
import { ROLE_LABELS, ROLES, getSession } from "../../auth/session";
import { formatDate } from "../../utils/format";
import { downloadRequestPdf } from "./requestPdf";
import { FORMS, LOCATIONS, STATUS_TONES, VENUES, labelFor, requestsBase, totalEnrolment } from "./shared";
import styles from "./SchoolRequests.module.css";

const DATE_TIME = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

const EVENT_LOOKS = {
  Created: { icon: "bi-plus-circle", tone: "slate" },
  Updated: { icon: "bi-pencil", tone: "blue" },
  Submitted: { icon: "bi-send", tone: "amber" },
  Accepted: { icon: "bi-check-circle", tone: "green" },
};

// One school request: the whole form as submitted, what happened to it, and the steps
// the viewer can take next (the division edits and submits, the super admin accepts).
export default function SchoolRequestView() {
  const { requestId } = useParams();
  const session = getSession();
  const isSuper = session.role === ROLES.SUPER_ADMIN;
  const base = requestsBase(session);
  const navigate = useNavigate();
  const location = useLocation();

  const request = useAsync(useCallback(() => getSchoolRequest(requestId), [requestId]));
  const [dialog, setDialog] = useState(null); // "accept" | "delete"
  const [accepted, setAccepted] = useState(null); // the accept result, shown once
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

  // A message passed from the form, e.g. after submitting
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const r = request.data;
  const form = r?.form;
  const name = r?.school_name || `Request ${requestId}`;
  const canEdit = !isSuper && r?.status === "Draft";

  const act = async (action, message) => {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      notifySchoolRequestsChanged();
      if (message) showToast(message);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (await act(() => submitSchoolRequest(r.id), "Request submitted to MCDE.")) request.reload();
  };
  const handleDelete = async () => {
    setDialog(null);
    if ((await act(() => deleteSchoolRequest(r.id).then(() => true))) !== null) {
      navigate(base, { replace: true });
    }
  };

  return (
    <Page
      icon="bi-building-add"
      title={r ? name : "School Request"}
      subtitle={r ? `${r.district_name || "No district"} · ${r.region_name} division` : "Registration form for an Open Secondary School"}
      stats={r ? [{ label: "Students at start", value: totalEnrolment(form.enrolment) }] : []}
      actions={
        <Button variant="ghost" icon="bi-arrow-left" to={base}>
          All requests
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <DataState loading={request.loading} error={request.error} onRetry={request.reload}>
        {r && (
          <>
            <StatusNotice request={r} isSuper={isSuper} />
            {error && <Notice tone="red">{error}</Notice>}

            <div className="d-flex flex-wrap gap-2">
              <Button variant="ghost" icon="bi-download" onClick={() => downloadRequestPdf(r)}>
                Download copy
              </Button>
              {canEdit && (
                <>
                  <Button variant="ghost" icon="bi-pencil" to={`${base}/${r.id}/edit`}>
                    Edit
                  </Button>
                  <Button icon="bi-send" onClick={handleSubmit} disabled={busy}>
                    {busy ? "Submitting…" : "Submit to MCDE"}
                  </Button>
                  <Button variant="danger" icon="bi-trash" onClick={() => setDialog("delete")}>
                    Delete request
                  </Button>
                </>
              )}
              {isSuper && r.status === "Submitted" && (
                <Button variant="success" icon="bi-check-lg" onClick={() => setDialog("accept")}>
                  Accept and register school
                </Button>
              )}
            </div>

            <FormDetails request={r} />

            <Card accent="slate" icon="bi-clock-history" title="What happened" subtitle="Every step taken on this request">
              <ol className={styles.timeline}>
                {r.history.map((event, i) => {
                  const look = EVENT_LOOKS[event.action] || { icon: "bi-dot", tone: "slate" };
                  return (
                    <li key={i} className={styles.event}>
                      <span className={`${styles.eventIcon} ui-tone-${look.tone}`}>
                        <i className={`bi ${look.icon}`} />
                      </span>
                      <div>
                        <div className={styles.eventTitle}>
                          {event.action} by {event.actor_name || "someone not recorded"}
                        </div>
                        <div className={styles.sub}>
                          {[ROLE_LABELS[event.actor_role] || event.actor_role, formatDate(event.at, DATE_TIME)].filter(Boolean).join(" · ")}
                        </div>
                        {event.note && event.action !== "Created" && <div className={styles.note}>“{event.note}”</div>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            <AcceptDialog
              show={dialog === "accept"}
              request={r}
              onHide={() => setDialog(null)}
              onAccepted={(result) => {
                setDialog(null);
                setAccepted(result);
                notifySchoolRequestsChanged();
                request.reload();
              }}
            />
            <TypeToConfirm
              show={dialog === "delete"}
              name={name}
              title="Delete Request"
              confirmLabel="Delete request"
              onHide={() => setDialog(null)}
              onConfirm={handleDelete}
            >
              Deleting this request removes the form for <strong>{name}</strong>. Its history stays in the audit log.
            </TypeToConfirm>
            <AcceptedDialog result={accepted} request={r} onHide={() => setAccepted(null)} />
          </>
        )}
      </DataState>
    </Page>
  );
}

function StatusNotice({ request: r, isSuper }) {
  const badge = <Badge tone={STATUS_TONES[r.status]}>{r.status}</Badge>;
  switch (r.status) {
    case "Draft":
      return (
        <Notice tone="blue">
          <span>{badge} Not yet submitted. Check every part, download a copy, then submit it to MCDE.</span>
        </Notice>
      );
    case "Submitted":
      return (
        <Notice tone="amber">
          <span>
            {badge} Submitted by {r.submitted_by_name} on {formatDate(r.submitted_at)}.{" "}
            {isSuper ? "Accept it to register the school and create the coordinator's account." : "Waiting for MCDE to accept it."}
          </span>
        </Notice>
      );
    case "Accepted":
      return (
        <Notice tone="green">
          <span>
            {badge} Accepted by {r.decided_by_name} on {formatDate(r.decided_at)}. Registration number{" "}
            <strong>{r.registration_number}</strong>; the school is now registered.
          </span>
        </Notice>
      );
    default:
      return null;
  }
}

// The form laid out in the same parts as the paper version
function FormDetails({ request: r }) {
  const form = r.form;
  return (
    <>
      <div className={styles.partLabel}>Part A · Host institution</div>
      <Card accent="blue" icon="bi-building" title="School and head teacher">
        <div className={styles.detailColumns}>
          <div>
            <DetailRow label="School name" value={form.school_name} />
            <DetailRow label="District" value={r.district_name} />
            <DetailRow label="Division" value={r.region_name} />
            <DetailRow label="Location" value={labelFor(LOCATIONS, form.location)} />
            <DetailRow label="Address" value={<span style={{ whiteSpace: "pre-line" }}>{form.address}</span>} />
          </div>
          <div>
            <DetailRow label="Head teacher" value={form.head_teacher.name} />
            <DetailRow label="Phone" value={form.head_teacher.phone} />
            <DetailRow label="Email" value={form.head_teacher.email} />
            <DetailRow
              label="Place to run the OSS"
              value={form.venue_type ? `${labelFor(VENUES, form.venue_type)}: ${form.venue_name || "-"}` : ""}
            />
            <DetailRow label="Distance to next OSS" value={form.distance_km == null ? "" : `${form.distance_km} km`} />
          </div>
        </div>
      </Card>

      <Card accent="blue" icon="bi-people" title="Teachers/facilitators available" subtitle={`${form.facilitators.length} listed`} flush>
        <Table compact>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Qualification</th>
              <th>Subject combination</th>
            </tr>
          </thead>
          <tbody>
            {form.facilitators.length === 0 && (
              <tr>
                <td colSpan={4}>None listed yet.</td>
              </tr>
            )}
            {form.facilitators.map((f, i) => (
              <tr key={i}>
                <td className="num">{i + 1}</td>
                <td className="strong">{f.name || "-"}</td>
                <td>{f.qualification || "-"}</td>
                <td>{f.subject_combination || "-"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card accent="blue" icon="bi-person-badge" title="Coordinator and initial enrolment">
        <div className={styles.detailColumns}>
          <div>
            <DetailRow label="Recommended coordinator" value={form.coordinator.name} />
            <DetailRow label="Qualifications" value={form.coordinator.qualifications} />
            <DetailRow label="Email" value={form.coordinator.email} />
            <DetailRow label="Phone" value={form.coordinator.phone} />
          </div>
          <div>
            {FORMS.map((key, i) => (
              <DetailRow key={key} label={`Form ${i + 1}`} value={form.enrolment[key] == null ? "" : String(form.enrolment[key])} />
            ))}
            <DetailRow label="Total" value={<strong>{totalEnrolment(form.enrolment)}</strong>} />
          </div>
        </div>
      </Card>

      <div className={styles.partLabel}>Part B · Endorsements</div>
      <Card accent="purple" icon="bi-patch-check" title="PTA/Board and division">
        <div className={styles.detailColumns}>
          <div>
            <DetailRow
              label="PTA/Board members"
              value={form.pta_members.length ? <span style={{ whiteSpace: "pre-line" }}>{form.pta_members.join("\n")}</span> : ""}
            />
          </div>
          <div>
            <DetailRow
              label="EDM (division)"
              value={r.submitted_at ? `Recommended by ${r.submitted_by_name}, ${formatDate(r.submitted_at)}` : "Recorded when submitted"}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

function AcceptDialog({ show, request: r, onHide, onAccepted }) {
  const [number, setNumber] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const coordinator = r.form.coordinator;

  useEffect(() => {
    if (show) {
      setNumber("");
      setChecked(false);
      setError("");
    }
  }, [show]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAccepted(await acceptSchoolRequest(r.id, number.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      show={show}
      onHide={onHide}
      title="Accept and Register School"
      icon="bi-check-circle"
      as="form"
      onSubmit={submit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="success" icon="bi-check-lg" disabled={busy || !number.trim() || !checked}>
            {busy ? "Registering…" : "Accept and register"}
          </Button>
        </>
      }
    >
      <div className="ui-grid">
        <div style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
          <p>
            This registers <strong>{r.school_name}</strong> in {r.district_name} district with the number you give, using the
            head teacher and address from the form.
          </p>
          <p className="mb-0">
            The coordinator, <strong>{coordinator.name}</strong> ({coordinator.email}), gets an account to register the
            school&apos;s learners.
          </p>
        </div>
        <Field label="Registration number" required>
          <Input value={number} maxLength={100} autoFocus onChange={(e) => setNumber(e.target.value)} placeholder="e.g. OSS-2026-014" />
        </Field>
        <Notice tone="amber">
          <span>
            <strong>Accepting is final.</strong> The request cannot be sent back to the division or changed afterwards, so
            check every part of the form first. Any mistake found later has to be corrected on the school&apos;s record
            (Manage → Schools) or the coordinator&apos;s account (Manage → Accounts).
          </span>
        </Notice>
        <Switch checked={checked} onChange={setChecked}>
          I have checked the details on this request
        </Switch>
        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Dialog>
  );
}

// Shown once after accepting: the new school and the coordinator's temporary password
function AcceptedDialog({ result, request: r, onHide }) {
  return (
    <Dialog
      show={!!result}
      onHide={onHide}
      title="School Registered"
      icon="bi-check-circle"
      footer={
        <>
          <Button variant="ghost" icon="bi-building" to="/admin/manageschools">
            View schools
          </Button>
          <Button onClick={onHide}>Done</Button>
        </>
      }
    >
      {result && (
        <div className="ui-grid">
          <Notice tone="green">
            {r.school_name} is registered with number {r.registration_number || "given"}.
          </Notice>
          {result.account && (
            <div>
              <p style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
                Account created for <strong>{result.account.account.name}</strong> ({result.account.account.email}). Give them
                this temporary password; it is shown only once and must be changed when they first sign in.
              </p>
              <div className={styles.password}>{result.account.temporary_password}</div>
            </div>
          )}
          {result.account_error && <Notice tone="amber">{result.account_error}</Notice>}
        </div>
      )}
    </Dialog>
  );
}
