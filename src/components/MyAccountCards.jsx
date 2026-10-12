import { useCallback, useEffect, useState } from "react";

import { getMyAccount, updateMyContact } from "../api/accounts";
import { ROLE_LABELS, ROLES } from "../auth/session";
import useAsync from "../hooks/useAsync";
import { formatPhone } from "../utils/format";
import ChangePasswordForm from "./ChangePasswordForm";
import DataState from "./DataState";
import DetailRow from "./DetailRow";
import { Button, Card, Field, Input, Notice } from "./ui";

// Who sees the signed-in user's numbers, per role (matches the contact directory rules)
const VISIBILITY = {
  [ROLES.SUPER_ADMIN]: "Every OSS user can see these numbers. Use an office or helpdesk number if you prefer.",
  [ROLES.REGIONAL_ADMIN]: "Every OSS user can see these numbers, so schools can reach their division.",
  [ROLES.SCHOOL_MANAGER]: "Only the ministry, your division office and your school's other OSS users can see these numbers.",
};

// The signed-in user's account, with the numbers others use to reach them.
export function MyAccountCard() {
  const { data: account, loading, error, reload } = useAsync(useCallback(() => getMyAccount(), []));
  const [values, setValues] = useState({ phone: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (account) setValues({ phone: formatPhone(account.phone), whatsapp: formatPhone(account.whatsapp) });
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updateMyContact(values);
      setValues({ phone: formatPhone(saved.phone), whatsapp: formatPhone(saved.whatsapp) });
      setMessage({ tone: "green", text: "Your contact details were saved." });
    } catch (err) {
      setMessage({ tone: "red", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card accent="blue" icon="bi-person-circle" title="My account" subtitle="How other OSS users can reach you">
      <DataState loading={loading} error={error} onRetry={reload}>
        {account && (
          <>
            <DetailRow label="Name" value={account.name} />
            <DetailRow label="Sign-in email" value={account.email} />
            <DetailRow label="Role" value={ROLE_LABELS[account.role]} />
            <form onSubmit={handleSubmit} className="ui-grid ui-cols-2" style={{ marginTop: 14 }}>
              <Field label="Mobile number" hint="e.g. 0991 234 567">
                <Input
                  type="tel"
                  maxLength={25}
                  value={values.phone}
                  onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </Field>
              <Field label="WhatsApp number" hint="Only if different">
                <Input
                  type="tel"
                  maxLength={25}
                  value={values.whatsapp}
                  onChange={(e) => setValues((prev) => ({ ...prev, whatsapp: e.target.value }))}
                />
              </Field>
              <div className="ui-span-all">
                <Notice tone="blue">{VISIBILITY[account.role]}</Notice>
              </div>
              {message && (
                <div className="ui-span-all">
                  <Notice tone={message.tone}>{message.text}</Notice>
                </div>
              )}
              <div>
                <Button type="submit" icon="bi-save" disabled={saving}>
                  {saving ? "Saving…" : "Save numbers"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DataState>
    </Card>
  );
}

export function ChangePasswordCard() {
  return (
    <Card accent="purple" icon="bi-shield-lock" title="Password" subtitle="Change the password you sign in with">
      <ChangePasswordForm />
    </Card>
  );
}
