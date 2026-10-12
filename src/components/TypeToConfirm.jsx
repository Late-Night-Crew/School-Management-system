import { useEffect, useState } from "react";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import { Field, Input } from "./ui/Field";
import { nameMatches } from "../utils/confirmName";

// "Type <name> to confirm" input, for dialogs that confirm a dangerous action
export function NameConfirmField({ name, value, onChange, label = "To confirm, type the name below" }) {
  return (
    <Field label={label} hint={<strong>{name}</strong>}>
      <Input
        value={value}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder={name}
        aria-label={`Type ${name} to confirm`}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => e.preventDefault()}
      />
    </Field>
  );
}

// Confirmation for actions that destroy data: the confirm button only works once the
// user has typed the name of the thing affected.
//
//   <TypeToConfirm show={!!deleting} name={deleting?.name} title="Delete Student"
//     confirmLabel="Delete student" onHide={…} onConfirm={…}>
//     What will be lost…
//   </TypeToConfirm>
export default function TypeToConfirm({ show, onHide, onConfirm, name, title, icon = "bi-exclamation-triangle", confirmLabel = "Delete", busy = false, children }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (show) setTyped("");
  }, [show, name]);
  const ready = nameMatches(name, typed) && !busy;

  return (
    <Dialog
      show={show}
      onHide={onHide}
      title={title}
      icon={icon}
      as="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) onConfirm();
      }}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={!ready}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="ui-grid">
        <div style={{ fontSize: 14, color: "var(--ui-text-body)" }}>{children}</div>
        <NameConfirmField name={name} value={typed} onChange={setTyped} />
      </div>
    </Dialog>
  );
}
