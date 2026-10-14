import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import { getPublicPlaces, requestPasswordReset } from "../../api/accounts";
import useAsync from "../../hooks/useAsync";
import { Button, Field, Input, Notice, Segmented, Select, Textarea } from "../../components/ui";
import styles from "./LoginPage.module.css";

const ROLE_OPTIONS = [
  { value: "SCHOOL_MANAGER", label: "School" },
  { value: "REGIONAL_ADMIN", label: "Division office" },
  { value: "SUPER_ADMIN", label: "MCDE" },
];

// Who will deal with the request, shown before sending it
const HANDLED_BY = {
  SCHOOL_MANAGER: "Your division office will receive your request and contact you with a temporary password.",
  REGIONAL_ADMIN: "MCDE will receive your request and contact you with a temporary password.",
};

// "Forgot password" for people without an email service to reset it: the request goes
// to the office above them, who reset it and pass on a temporary password.
export default function ForgotPasswordPage() {
  const places = useAsync(useCallback(() => getPublicPlaces(), []));
  const regions = places.data?.regions || [];
  const schools = places.data?.schools || [];

  const [role, setRole] = useState("SCHOOL_MANAGER");
  const [form, setForm] = useState({ email: "", region_id: "", school_id: "", contact_phone: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));
  const schoolsInRegion = schools.filter((s) => String(s.region_id) === form.region_id);
  const ready =
    form.email.trim() && form.region_id && (role === "REGIONAL_ADMIN" || form.school_id) && role !== "SUPER_ADMIN";

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      const { message } = await requestPasswordReset({
        role,
        email: form.email.trim(),
        region_id: role === "REGIONAL_ADMIN" ? Number(form.region_id) : 0,
        school_id: role === "SCHOOL_MANAGER" ? Number(form.school_id) : 0,
        contact_phone: form.contact_phone.trim(),
        note: form.note.trim(),
      });
      setSent(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <i className="bi bi-key-fill" />
          </div>
          <div>
            <h1 className={styles.title}>Forgot your password?</h1>
            <div className={styles.sub}>Ask your office for a new one</div>
          </div>
        </div>

        {sent ? (
          <div className={styles.form}>
            <Notice tone="green">{sent}</Notice>
            <Button to="/login" icon="bi-arrow-left" className={styles.submit}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            <Field label="I work at">
              <Segmented options={ROLE_OPTIONS} value={role} onChange={setRole} />
            </Field>

            {role === "SUPER_ADMIN" ? (
              <Notice tone="blue">
                The MCDE account is reset by the system administrator. Contact your ICT support.
              </Notice>
            ) : (
              <>
                <Field label="Email you sign in with" required>
                  <Input type="email" autoComplete="username" value={form.email} onChange={set("email")} placeholder="you@example.com" />
                </Field>
                <Field label="Division" required>
                  <Select
                    value={form.region_id}
                    onChange={(e) => setForm((f) => ({ ...f, region_id: e.target.value, school_id: "" }))}
                    disabled={places.loading}
                  >
                    <option value="">{places.loading ? "Loading…" : "Choose your division"}</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                {role === "SCHOOL_MANAGER" && (
                  <Field label="School" required>
                    <Select value={form.school_id} onChange={set("school_id")} disabled={!form.region_id}>
                      <option value="">{form.region_id ? "Choose your school" : "Choose your division first"}</option>
                      {schoolsInRegion.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label="Phone number to reach you" hint="Optional, if different from the one on your account">
                  <Input type="tel" value={form.contact_phone} onChange={set("contact_phone")} placeholder="e.g. 0991 234 567" />
                </Field>
                <Field label="Message">
                  <Textarea rows={2} maxLength={500} value={form.note} onChange={set("note")} placeholder="Optional" />
                </Field>
                <div className="ui-hint">{HANDLED_BY[role]}</div>
                {(error || places.error) && <Notice tone="red">{error || places.error}</Notice>}
                <Button type="submit" icon="bi-send" className={styles.submit} disabled={!ready || busy}>
                  {busy ? "Sending…" : "Send request"}
                </Button>
              </>
            )}
            <Link to="/login" className={styles.link}>
              Back to sign in
            </Link>
          </form>
        )}

        <div className={styles.footer}>© {new Date().getFullYear()} Open Secondary School</div>
      </div>
    </div>
  );
}
