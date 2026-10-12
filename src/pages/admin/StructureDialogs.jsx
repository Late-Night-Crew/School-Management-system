import { useCallback, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

import { NameConfirmField } from "../../components/TypeToConfirm";
import { nameMatches } from "../../utils/confirmName";
import { Button, Dialog, Field, Notice, Select, Textarea } from "../../components/ui";

// Dialogs for the dangerous changes to divisions, districts and schools. Each one first
// asks the server what is still on record, explains what the action will do, and only
// lets it go ahead once the user has typed the name of the thing affected.

const countOf = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;

// Loads usage for `id` whenever it changes; `reload` fetches it again after a change
function useUsage(id, getUsage) {
  const [state, setState] = useState({ usage: null, loading: false, error: "" });
  const load = useCallback(() => {
    if (!id) return undefined;
    let current = true;
    setState({ usage: null, loading: true, error: "" });
    getUsage(id).then(
      (usage) => current && setState({ usage, loading: false, error: "" }),
      (err) => current && setState({ usage: null, loading: false, error: err.message })
    );
    return () => {
      current = false;
    };
  }, [id, getUsage]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

function Loading() {
  return (
    <div className="ui-loading">
      <Spinner animation="border" size="sm" className="me-2" />
      Checking what is on record…
    </div>
  );
}

const bodyStyle = { fontSize: 14, color: "var(--ui-text-body)" };

// Deleting a district or division. One with schools (or districts) under it cannot be
// deleted, so the dialog first offers to move them all somewhere else.
//
// config: { noun: "district", childNoun: "school", getUsage, childCount(usage), move, remove }
// targets: [{ id, label }] the places the children can move to (the item itself excluded)
export function DeleteContainerDialog({ item, config, targets, onHide, onChanged, accountsPath }) {
  const loaded = useUsage(item?.id, config.getUsage);
  // While the dialog animates closed, item is already gone but the old usage is not
  const usage = item ? loaded.usage : null;
  const { loading, error: loadError, reload } = loaded;
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTarget("");
    setTyped("");
    setError("");
  }, [item]);

  const children = usage ? config.childCount(usage) : 0;
  const step = !usage ? null : children > 0 ? "move" : usage.active_accounts > 0 ? "accounts" : "delete";
  const targetLabel = targets.find((t) => String(t.id) === target)?.label;
  const ready = !busy && nameMatches(item?.name, typed) && (step === "delete" || (step === "move" && target));

  const run = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      if (step === "move") {
        const { moved } = await config.move(item.id, Number(target));
        onChanged(`Moved ${countOf(moved, config.childNoun)} from ${item.name} to ${targetLabel}.`, false);
        setTyped("");
        reload();
      } else {
        await config.remove(item.id);
        onChanged(`${item.name} deleted.`, true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const Noun = config.noun[0].toUpperCase() + config.noun.slice(1);
  return (
    <Dialog
      show={!!item}
      onHide={onHide}
      title={step === "move" ? `Move ${config.childNoun}s out of ${item?.name}` : `Delete ${Noun}`}
      icon={step === "move" ? "bi-box-arrow-right" : "bi-exclamation-triangle"}
      as="form"
      onSubmit={run}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            {step === "accounts" ? "Close" : "Cancel"}
          </Button>
          {step === "move" && (
            <Button type="submit" variant="danger" icon="bi-box-arrow-right" disabled={!ready}>
              {busy ? "Moving…" : `Move ${countOf(children, config.childNoun)}`}
            </Button>
          )}
          {step === "delete" && (
            <Button type="submit" variant="danger" icon="bi-trash" disabled={!ready}>
              {busy ? "Deleting…" : `Delete ${config.noun}`}
            </Button>
          )}
        </>
      }
    >
      <div className="ui-grid">
        {loading && <Loading />}
        {loadError && <Notice tone="red">{loadError}</Notice>}

        {step === "move" && (
          <>
            <div style={bodyStyle}>
              <strong>{item.name}</strong> has {countOf(children, config.childNoun)}
              {config.extra ? config.extra(usage) : ""}. Deleting it would erase all of them, so they have to
              move to another {config.noun} first. Everything under them moves too: students, marks, transfers
              and accounts stay exactly as they are.
            </div>
            <Field label={`Move them to`} required>
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choose a {config.noun}</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <NameConfirmField name={item.name} value={typed} onChange={setTyped} />
          </>
        )}

        {step === "accounts" && (
          <Notice tone="amber">
            <span>
              {item.name} has no {config.childNoun}s, but {countOf(usage.active_accounts, "active account")}{" "}
              {usage.active_accounts === 1 ? "is" : "are"} still linked to it. Deactivate{" "}
              {usage.active_accounts === 1 ? "it" : "them"} on the Accounts page, then delete the {config.noun}.
            </span>
            {accountsPath && (
              <Button variant="ghost" size="sm" icon="bi-people" to={accountsPath}>
                Accounts
              </Button>
            )}
          </Notice>
        )}

        {step === "delete" && (
          <>
            <div style={bodyStyle}>
              <strong>{item.name}</strong> is empty, so nothing else is lost. Deleting it cannot be undone.
            </div>
            <NameConfirmField name={item.name} value={typed} onChange={setTyped} />
          </>
        )}

        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Dialog>
  );
}

// What a school still has on record, as a readable list, e.g. "12 students, 306 marks and 1 transfer"
function describeRecords(usage) {
  const parts = [
    usage.students && countOf(usage.students, "student"),
    usage.marks && countOf(usage.marks, "mark"),
    usage.transfers && countOf(usage.transfers, "transfer"),
    usage.exam_results && countOf(usage.exam_results, "exam result"),
  ].filter(Boolean);
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

// Delete, close, reopen a school, or transfer all its students to another school.
// mode: "delete" | "close" | "reopen" | "transfer". A school with records cannot be
// deleted; the dialog offers to transfer its students and close it instead.
// api: { getUsage, remove, close, reopen, transferAll }
// targets: [{ id, label }] open schools the students can be transferred to
export function SchoolDialog({ school, mode: initialMode, api, targets = [], onHide, onChanged }) {
  const loaded = useUsage(school?.id, api.getUsage);
  // While the dialog animates closed, school is already gone but the old usage is not
  const usage = school ? loaded.usage : null;
  const { loading, error: loadError } = loaded;
  const [mode, setMode] = useState(initialMode);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setTyped("");
    setNote("");
    setTarget("");
    setError("");
  }, [school, initialMode]);

  const switchTo = (next) => {
    setMode(next);
    setTyped("");
    setNote("");
    setError("");
  };

  const records = usage ? describeRecords(usage) : "";
  let step = null;
  if (usage) {
    if (mode === "reopen") step = "reopen";
    else if (mode === "transfer") step = usage.students > 0 ? "transfer" : "no-students";
    else if (mode === "close") step = usage.unfinished_incoming_transfers > 0 ? "transfers" : "close";
    else if (usage.can_delete) step = "delete";
    else step = records ? "has-records" : "accounts";
  }
  const movable = usage ? usage.students - usage.students_with_pending_transfers : 0;
  const targetLabel = targets.find((t) => String(t.id) === target)?.label;
  const needsName = step === "delete" || step === "close" || step === "transfer";
  const ready =
    !busy &&
    (step === "reopen" ||
      (needsName &&
        nameMatches(school?.name, typed) &&
        (step !== "transfer" || (target && note.trim() && movable > 0))));

  const run = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      if (step === "delete") {
        await api.remove(school.id);
        onChanged(`${school.name} deleted.`);
      } else if (step === "transfer") {
        const { transferred, skipped } = await api.transferAll(school.id, Number(target), note.trim());
        onChanged(
          `Transferred ${countOf(transferred, "student")} from ${school.name} to ${targetLabel}.` +
            (skipped ? ` ${countOf(skipped, "student")} with a pending transfer ${skipped === 1 ? "was" : "were"} left.` : "")
        );
      } else if (step === "close") {
        const { accounts_deactivated: deactivated } = await api.close(school.id, note.trim());
        onChanged(
          `${school.name} closed.${deactivated ? ` ${countOf(deactivated, "account")} deactivated.` : ""}`
        );
      } else {
        await api.reopen(school.id);
        onChanged(`${school.name} reopened. Reactivate its accounts on the Accounts page when ready.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    delete: "Delete School",
    "has-records": "This school can't be deleted",
    accounts: "Delete School",
    close: "Close School",
    transfers: "Close School",
    reopen: "Reopen School",
    transfer: "Transfer All Students",
    "no-students": "Transfer All Students",
  };
  const actions = {
    delete: { label: "Delete school", busy: "Deleting…", icon: "bi-trash", variant: "danger" },
    close: { label: "Close school", busy: "Closing…", icon: "bi-door-closed", variant: "danger" },
    reopen: { label: "Reopen school", busy: "Reopening…", icon: "bi-door-open", variant: "primary" },
    transfer: {
      label: `Transfer ${countOf(movable, "student")}`,
      busy: "Transferring…",
      icon: "bi-people",
      variant: "danger",
    },
  };
  const action = actions[step];

  return (
    <Dialog
      show={!!school}
      onHide={onHide}
      title={titles[step] || titles[mode] || "School"}
      icon={step === "reopen" ? "bi-door-open" : step === "transfer" ? "bi-people" : "bi-exclamation-triangle"}
      as="form"
      onSubmit={run}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            {action ? "Cancel" : "Close"}
          </Button>
          {(step === "has-records" || step === "close") && usage.students > 0 && (
            <Button variant="ghost" icon="bi-people" onClick={() => switchTo("transfer")}>
              Transfer students
            </Button>
          )}
          {step === "has-records" && !usage.closed && (
            <Button variant="danger" icon="bi-door-closed" onClick={() => switchTo("close")}>
              Close it instead
            </Button>
          )}
          {action && (
            <Button type="submit" variant={action.variant} icon={action.icon} disabled={!ready}>
              {busy ? action.busy : action.label}
            </Button>
          )}
        </>
      }
    >
      <div className="ui-grid">
        {loading && <Loading />}
        {loadError && <Notice tone="red">{loadError}</Notice>}

        {step === "delete" && (
          <>
            <div style={bodyStyle}>
              <strong>{school.name}</strong> has no students, marks, transfers or exam results, so nothing else is
              lost. Deleting it cannot be undone.
            </div>
            <NameConfirmField name={school.name} value={typed} onChange={setTyped} />
          </>
        )}

        {step === "has-records" && (
          <div style={bodyStyle}>
            <p>
              <strong>{school.name}</strong> has {records} on record. Deleting the school would erase them for good.
            </p>
            <p className="mb-0">
              {usage.closed
                ? "The school is already closed, which keeps these records. Its students can still be transferred out."
                : "Close the school instead: its records stay, its accounts are deactivated, and it stops taking new students, transfers and accounts."}
            </p>
          </div>
        )}

        {step === "accounts" && (
          <Notice tone="amber">
            <span>
              {school.name} has no records, but {countOf(usage.active_accounts, "active account")}{" "}
              {usage.active_accounts === 1 ? "is" : "are"} still linked to it. Deactivate{" "}
              {usage.active_accounts === 1 ? "it" : "them"} on the Accounts page, then delete the school.
            </span>
            <Button variant="ghost" size="sm" icon="bi-people" to="/admin/accounts">
              Accounts
            </Button>
          </Notice>
        )}

        {step === "transfers" && (
          <Notice tone="amber">
            <span>
              {countOf(usage.unfinished_incoming_transfers, "transfer")} into {school.name}{" "}
              {usage.unfinished_incoming_transfers === 1 ? "is" : "are"} not finished. Reject or complete{" "}
              {usage.unfinished_incoming_transfers === 1 ? "it" : "them"} before closing the school.
            </span>
            <Button variant="ghost" size="sm" icon="bi-arrow-left-right" to="/admin/transfers">
              Transfers
            </Button>
          </Notice>
        )}

        {step === "close" && (
          <>
            <div style={bodyStyle}>
              <p>Closing <strong>{school.name}</strong>:</p>
              <ul className="mb-0">
                <li>
                  keeps {records || "all its records"} on record; students can still be transferred out to other
                  schools{usage.students > 0 ? " (use Transfer students to move them all at once)" : ""}
                </li>
                <li>
                  {usage.active_accounts
                    ? `deactivates its ${countOf(usage.active_accounts, "active account")}, signing ${usage.active_accounts === 1 ? "that person" : "those people"} out at once`
                    : "has no active accounts to deactivate"}
                </li>
                <li>stops new students, incoming transfers, accounts and notices</li>
                <li>can be undone later by reopening the school</li>
              </ul>
            </div>
            <Field label="Reason (kept in the audit log)">
              <Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Merged into another school" />
            </Field>
            <NameConfirmField name={school.name} value={typed} onChange={setTyped} />
          </>
        )}

        {step === "no-students" && (
          <div style={bodyStyle}>
            <strong>{school.name}</strong> has no students to transfer.
          </div>
        )}

        {step === "transfer" && (
          <>
            <div style={bodyStyle}>
              <p>
                Moves {movable === usage.students ? "all " : ""}
                {countOf(movable, "student")} of <strong>{school.name}</strong> to the school you choose, as completed
                transfers. Each student&apos;s transfer history shows the move, and marks already recorded stay
                credited to {school.name}.
              </p>
              {usage.students_with_pending_transfers > 0 && (
                <Notice tone="amber">
                  {countOf(usage.students_with_pending_transfers, "student")}{" "}
                  {usage.students_with_pending_transfers === 1 ? "has" : "have"} a pending transfer and{" "}
                  {usage.students_with_pending_transfers === 1 ? "is" : "are"} left out. Approve or reject{" "}
                  {usage.students_with_pending_transfers === 1 ? "it" : "those"} on the Transfers page.
                </Notice>
              )}
            </div>
            <Field label="Transfer them to" required>
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choose an open school</option>
                {targets
                  .filter((t) => t.id !== school.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Reason (shown on every transfer and in the audit log)" required>
              <Textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. School closed; students moved to the nearest school" />
            </Field>
            <NameConfirmField name={school.name} value={typed} onChange={setTyped} />
          </>
        )}

        {step === "reopen" && (
          <div style={bodyStyle}>
            Reopen <strong>{school.name}</strong>? It can take new students, transfers and notices again. Its accounts
            stay deactivated until you reactivate them on the Accounts page.
          </div>
        )}

        {error && <Notice tone="red">{error}</Notice>}
      </div>
    </Dialog>
  );
}
