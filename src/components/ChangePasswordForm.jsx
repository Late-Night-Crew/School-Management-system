import { useState } from "react";

import { changeMyPassword } from "../api/accounts";
import { setMustChangePassword } from "../auth/session";
import { Button, Field, Input, Notice } from "./ui";

// Matches the server's rule: 8+ characters with letters and numbers
function passwordProblem(password) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use both letters and numbers.";
  return "";
}

// Change the signed-in user's password. Used on Settings and on the forced
// change after signing in with a temporary password.
export default function ChangePasswordForm({ submitLabel = "Change password", currentLabel = "Current password", onDone }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const problem = passwordProblem(values.next);
  const mismatch = values.confirm && values.confirm !== values.next ? "The passwords do not match." : "";
  const valid = values.current && !problem && values.next === values.confirm;

  const update = (name) => (e) => {
    setValues((prev) => ({ ...prev, [name]: e.target.value }));
    setDone(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    setError("");
    try {
      await changeMyPassword(values.current, values.next);
      setMustChangePassword(false);
      setValues({ current: "", next: "", confirm: "" });
      setTouched(false);
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="ui-grid">
      <Field label={currentLabel} required>
        <Input type="password" autoComplete="current-password" value={values.current} onChange={update("current")} />
      </Field>
      <Field
        label="New password"
        required
        hint="At least 8 characters, with letters and numbers."
        error={touched && values.next ? problem : ""}
      >
        <Input type="password" autoComplete="new-password" value={values.next} onChange={update("next")} />
      </Field>
      <Field label="Confirm new password" required error={mismatch}>
        <Input type="password" autoComplete="new-password" value={values.confirm} onChange={update("confirm")} />
      </Field>
      {error && <Notice tone="red">{error}</Notice>}
      {done && <Notice tone="green">Your password has been changed.</Notice>}
      <div>
        <Button type="submit" icon="bi-shield-lock" disabled={saving || !valid}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
