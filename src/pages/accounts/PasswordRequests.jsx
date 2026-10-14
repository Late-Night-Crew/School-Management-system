import { useCallback, useState } from "react";

import { dismissPasswordRequest, listPasswordRequests, notifyPasswordRequestsChanged, resolvePasswordRequest } from "../../api/accounts";
import { ROLE_LABELS } from "../../auth/session";
import ConfirmModal from "../../components/ConfirmModal";
import { EmailLink, PhoneLinks } from "../../components/ContactLinks";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import { Button, Card, Notice, Table } from "../../components/ui";

const DATE_TIME = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };

// "Forgot password" requests from the sign-in page that this office handles. Shown
// only while some are waiting. Resetting gives a temporary password to pass on.
// onIssued receives { account, temporary_password, contact_phone }.
export default function PasswordRequests({ onIssued }) {
  const requests = useAsync(useCallback(() => listPasswordRequests(), []));
  const [busyId, setBusyId] = useState(null);
  const [dismissing, setDismissing] = useState(null);
  const [error, setError] = useState("");

  const pending = requests.data || [];
  if (!pending.length && !error) return null;

  const handle = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      const result = await action();
      notifyPasswordRequestsChanged();
      requests.reload();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const reset = async (request) => {
    const issued = await handle(request.id, () => resolvePasswordRequest(request.id));
    if (issued) onIssued({ ...issued, contact_phone: request.contact_phone });
  };
  const dismiss = async () => {
    const request = dismissing;
    setDismissing(null);
    await handle(request.id, () => dismissPasswordRequest(request.id));
  };

  return (
    <Card
      accent="amber"
      icon="bi-key"
      title="Password requests"
      subtitle={`${pending.length} waiting · people who forgot their password asked you for a new one`}
      flush
    >
      {error && (
        <div style={{ padding: "0 20px" }}>
          <Notice tone="red">{error}</Notice>
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Where</th>
            <th>How to reach them</th>
            <th>Asked</th>
            <th className="end">Action</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="strong">{r.name}</div>
                <EmailLink email={r.email} />
              </td>
              <td>
                <div>{ROLE_LABELS[r.role]}</div>
                <div className="ui-hint">{r.school_name || r.region_name}</div>
              </td>
              <td>
                {r.contact_phone && (
                  <div>
                    <PhoneLinks phone={r.contact_phone} label="Asked to be called on" />
                  </div>
                )}
                <PhoneLinks phone={r.phone} whatsapp={r.whatsapp} />
                {r.note && <div className="ui-hint">“{r.note}”</div>}
              </td>
              <td>{formatDate(r.created_at, DATE_TIME)}</td>
              <td className="end">
                <div className="d-inline-flex gap-2">
                  <Button size="sm" icon="bi-key" onClick={() => reset(r)} disabled={busyId === r.id}>
                    {busyId === r.id ? "Resetting…" : "Reset password"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDismissing(r)} disabled={busyId === r.id}>
                    Dismiss
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ConfirmModal
        show={!!dismissing}
        onHide={() => setDismissing(null)}
        onConfirm={dismiss}
        title="Dismiss Request"
        confirmLabel="Dismiss"
        body={
          dismissing &&
          `Dismiss ${dismissing.name}'s request without resetting their password? Do this if you did not recognise the request or have already helped them.`
        }
      />
    </Card>
  );
}
