import { useCallback, useState } from "react";

import {
  activateAccount,
  createAccount,
  deactivateAccount,
  listAccounts,
  resetAccountPassword,
  updateAccount,
} from "../../api/accounts";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import { listDistricts } from "../../api/districts";
import { ROLE_LABELS, ROLES, getSession } from "../../auth/session";
import { EmailLink, PhoneLinks } from "../../components/ContactLinks";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { formatDate, formatPhone } from "../../utils/format";
import { Badge, Button, Card, Dialog, Field, Input, Notice, Page, SearchInput, Select, Table, Textarea } from "../../components/ui";
import styles from "./Accounts.module.css";
import PasswordRequests from "./PasswordRequests";

const DATE_TIME = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

// Regional admins and school managers. The super admin manages both; a regional admin
// manages the school managers in their own division.
export default function AccountsPage() {
  const session = getSession();
  const isSuper = session.role === ROLES.SUPER_ADMIN;

  const accounts = useAsync(useCallback(() => listAccounts(), []));
  const { data: places } = useAsync(useCallback(() => Promise.all([listRegions(), listDistricts(), listSchools()]), []));
  const [regions = [], districts = [], allSchools = []] = places || [];
  // A regional admin can only add managers to schools in their own division
  const ownDistrictIds = new Set(districts.filter((d) => d.region_id === Number(session.regionId)).map((d) => d.id));
  // Closed schools take no new accounts
  const openSchools = allSchools.filter((s) => !s.closed_at);
  const schools = isSuper ? openSchools : openSchools.filter((s) => ownDistrictIds.has(s.district_id));

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("active");
  const [dialog, setDialog] = useState(null); // { kind: "create" | "edit" | "deactivate", account }
  const [issued, setIssued] = useState(null); // { account, temporary_password, reason }
  const [alert, setAlert] = useState(null);

  const showAlert = (tone, message) => {
    setAlert({ tone, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const all = accounts.data || [];
  const term = search.trim().toLowerCase();
  const visible = all.filter(
    (a) =>
      (!role || a.role === role) &&
      (status === "all" || (status === "active" ? a.active : !a.active)) &&
      `${a.name} ${a.email} ${a.school_name} ${a.school_number} ${a.region_name}`.toLowerCase().includes(term)
  );
  const { page, pageCount, pageItems, setPage } = usePagination(visible, 25);

  const afterChange = (message) => {
    setDialog(null);
    accounts.reload();
    if (message) showAlert("green", message);
  };

  const handleReset = async (account) => {
    try {
      const result = await resetAccountPassword(account.id);
      setDialog(null);
      setIssued({ ...result, reason: "reset" });
      accounts.reload();
    } catch (err) {
      setDialog(null);
      showAlert("red", err.message);
    }
  };

  const handleActivate = async (account) => {
    try {
      await activateAccount(account.id);
      afterChange(`${account.name} can sign in again.`);
    } catch (err) {
      showAlert("red", err.message);
    }
  };

  return (
    <Page
      icon="bi-people"
      title="Accounts"
      subtitle={
        isSuper
          ? "Create and manage MCDE staff, regional admins and school managers. People are deactivated rather than deleted, so their history stays."
          : "Create and manage the school manager accounts for schools in your division."
      }
      stats={[
        { label: "Active", value: accounts.loading ? null : all.filter((a) => a.active).length },
        { label: "Never signed in", value: accounts.loading ? null : all.filter((a) => a.active && !a.last_login_at).length },
      ]}
      actions={
        <Button variant="ghost" icon="bi-person-plus" onClick={() => setDialog({ kind: "create" })}>
          Add account
        </Button>
      }
    >
      {alert && <Notice tone={alert.tone}>{alert.message}</Notice>}

      <PasswordRequests
        onIssued={(result) => {
          setIssued({ ...result, reason: "reset" });
          accounts.reload();
        }}
      />

      <Card accent="slate" icon="bi-funnel" title="Filters">
        <div className={`ui-grid ${isSuper ? "ui-cols-3" : "ui-cols-2"}`}>
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="Name, email, school or division" />
          </Field>
          {isSuper && (
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">All roles</option>
                <option value={ROLES.SUPER_ADMIN}>MCDE (Learner Support Managers)</option>
                <option value={ROLES.REGIONAL_ADMIN}>Regional admins</option>
                <option value={ROLES.SCHOOL_MANAGER}>School managers</option>
              </Select>
            </Field>
          )}
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
              <option value="all">All</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card accent="blue" icon="bi-people" title="Accounts" subtitle={`${visible.length} shown`} flush>
        <DataState
          loading={accounts.loading && !accounts.data}
          error={accounts.error}
          onRetry={accounts.reload}
          empty={visible.length === 0}
          emptyIcon="bi-people"
          emptyMessage="No accounts match these filters."
        >
          <Table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((a) => (
                <tr key={a.id} className={a.active ? "" : styles.inactive}>
                  <td>
                    <div className="strong">{a.name}</div>
                    <div className={styles.muted}>{a.email}</div>
                  </td>
                  <td>
                    <div>{ROLE_LABELS[a.role]}</div>
                    <div className={styles.muted}>
                      {a.role === ROLES.SUPER_ADMIN
                        ? "MCDE"
                        : a.role === ROLES.REGIONAL_ADMIN
                          ? `${a.region_name} division`
                          : `${a.school_name} · ${a.district_name}`}
                    </div>
                  </td>
                  <td>
                    {a.phone || a.whatsapp ? (
                      <PhoneLinks phone={a.phone} whatsapp={a.whatsapp} />
                    ) : (
                      <span className={styles.muted}>No phone</span>
                    )}
                  </td>
                  <td>
                    <StatusBadges account={a} />
                    <div className={styles.muted}>
                      {a.last_login_at ? `Last signed in ${formatDate(a.last_login_at, DATE_TIME)}` : "Never signed in"}
                    </div>
                  </td>
                  <td className="end">
                    <div className={styles.actions}>
                      {String(a.id) === String(session.userId) ? (
                        // Your own details and password are under My account (Settings)
                        <Badge tone="blue">You</Badge>
                      ) : a.active ? (
                        <>
                          <Button variant="ghost" size="sm" icon="bi-pencil" onClick={() => setDialog({ kind: "edit", account: a })}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" icon="bi-key" onClick={() => setDialog({ kind: "reset", account: a })}>
                            Reset password
                          </Button>
                          <Button variant="ghost" size="sm" icon="bi-person-x" onClick={() => setDialog({ kind: "deactivate", account: a })}>
                            Deactivate
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm" icon="bi-person-check" onClick={() => handleActivate(a)}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
        </DataState>
      </Card>

      {dialog?.kind === "create" && (
        <AccountDialog
          isSuper={isSuper}
          regions={regions}
          schools={schools}
          accounts={all}
          onHide={() => setDialog(null)}
          onCreated={(result) => {
            afterChange();
            setIssued({ ...result, reason: "created" });
          }}
        />
      )}
      {dialog?.kind === "edit" && (
        <AccountDialog
          account={dialog.account}
          onHide={() => setDialog(null)}
          onSaved={(account) => afterChange(`${account.name}'s details were saved.`)}
        />
      )}
      {dialog?.kind === "deactivate" && (
        <DeactivateDialog
          account={dialog.account}
          onHide={() => setDialog(null)}
          onDone={(account) => afterChange(`${account.name} can no longer sign in.`)}
        />
      )}
      {dialog?.kind === "reset" && (
        <Dialog
          show
          onHide={() => setDialog(null)}
          title={`Reset ${dialog.account.name}'s password`}
          icon="bi-key"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button icon="bi-key" onClick={() => handleReset(dialog.account)}>
                Issue temporary password
              </Button>
            </>
          }
        >
          <p className={styles.explain} style={{ marginTop: 0 }}>
            Their current password stops working at once. You will see a temporary password to give them, and they must
            choose a new one when they sign in.
          </p>
        </Dialog>
      )}
      {issued && <TemporaryPasswordDialog issued={issued} onHide={() => setIssued(null)} />}
    </Page>
  );
}

function StatusBadges({ account }) {
  if (!account.active) return <Badge tone="slate">Deactivated</Badge>;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <Badge tone="green">Active</Badge>
      {account.must_change_password && <Badge tone="amber">Temporary password</Badge>}
    </div>
  );
}

// Creates an account (no `account`) or edits one.
function AccountDialog({ account, isSuper, regions = [], schools = [], accounts = [], onHide, onCreated, onSaved }) {
  const editing = Boolean(account);
  const [values, setValues] = useState({
    role: account?.role || (isSuper ? ROLES.REGIONAL_ADMIN : ROLES.SCHOOL_MANAGER),
    region_id: "",
    school_id: "",
    name: account?.name || "",
    email: account?.email || "",
    phone: formatPhone(account?.phone),
    whatsapp: formatPhone(account?.whatsapp),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (name) => (e) => setValues((prev) => ({ ...prev, [name]: e.target.value }));

  const isRegional = values.role === ROLES.REGIONAL_ADMIN;
  const isMcde = values.role === ROLES.SUPER_ADMIN; // no division or school
  // Divisions that already have an active regional admin cannot get another one
  const takenRegions = new Set(accounts.filter((a) => a.active && a.role === ROLES.REGIONAL_ADMIN).map((a) => a.region_id));
  const scopeChosen = editing || isMcde || (isRegional ? values.region_id : values.school_id);
  const valid = scopeChosen && values.name.trim() && /\S+@\S+\.\S+/.test(values.email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError("");
    const details = { name: values.name.trim(), email: values.email.trim(), phone: values.phone, whatsapp: values.whatsapp };
    try {
      if (editing) {
        onSaved(await updateAccount(account.id, details));
      } else {
        onCreated(
          await createAccount({
            ...details,
            role: values.role,
            region_id: isRegional ? Number(values.region_id) : undefined,
            school_id: isRegional || isMcde ? undefined : Number(values.school_id),
          })
        );
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title={editing ? `Edit ${account.name}` : "Add Account"}
      icon={editing ? "bi-pencil" : "bi-person-plus"}
      size="lg"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" icon="bi-save" disabled={saving || !valid}>
            {saving ? "Saving…" : editing ? "Save" : "Create account"}
          </Button>
        </>
      }
    >
      {error && <Notice tone="red">{error}</Notice>}
      <div className="ui-grid ui-cols-2" style={{ marginTop: error ? 12 : 0 }}>
        {!editing && (
          <>
            <Field label="Role" required>
              <Select value={values.role} onChange={update("role")} disabled={!isSuper}>
                {isSuper && <option value={ROLES.REGIONAL_ADMIN}>Regional admin</option>}
                <option value={ROLES.SCHOOL_MANAGER}>School manager</option>
                {isSuper && <option value={ROLES.SUPER_ADMIN}>MCDE: Learner Support Manager</option>}
              </Select>
            </Field>
            {isMcde ? (
              <Field label="Access">
                <div className="ui-hint" style={{ paddingTop: 8 }}>
                  Full MCDE access, like yours. Everything they do is recorded in the activity log with their name.
                </div>
              </Field>
            ) : isRegional ? (
              <Field label="Division" required hint="Each division has one active regional admin.">
                <Select value={values.region_id} onChange={update("region_id")}>
                  <option value="">Choose a division…</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id} disabled={takenRegions.has(r.id)}>
                      {r.name}
                      {takenRegions.has(r.id) ? " (has an admin)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="School" required hint="A school can have more than one manager.">
                <Select value={values.school_id} onChange={update("school_id")}>
                  <option value="">Choose a school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.school_number})
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </>
        )}
        <Field label="Full name" required>
          <Input value={values.name} maxLength={150} onChange={update("name")} autoComplete="off" />
        </Field>
        <Field label="Email" required hint="They sign in with this email.">
          <Input type="email" value={values.email} maxLength={150} onChange={update("email")} autoComplete="off" />
        </Field>
        <Field label="Mobile number" hint="e.g. 0991 234 567">
          <Input type="tel" value={values.phone} maxLength={25} onChange={update("phone")} />
        </Field>
        <Field label="WhatsApp number" hint="Only if different from the mobile number">
          <Input type="tel" value={values.whatsapp} maxLength={25} onChange={update("whatsapp")} />
        </Field>
      </div>
      {!editing && (
        <p className={styles.explain}>
          A temporary password is created and shown to you once. Share it with them privately; they must choose their own
          password when they first sign in.
        </p>
      )}
    </Dialog>
  );
}

function DeactivateDialog({ account, onHide, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      onDone(await deactivateAccount(account.id, reason.trim()));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title={`Deactivate ${account.name}`}
      icon="bi-person-x"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon="bi-person-x" disabled={saving}>
            {saving ? "Deactivating…" : "Deactivate"}
          </Button>
        </>
      }
    >
      <p className={styles.explain}>
        {account.name} is signed out straight away and can no longer sign in. Their records stay, and you can reactivate the
        account later.
        {account.role === ROLES.REGIONAL_ADMIN && " The division can then be given a new regional admin."}
      </p>
      {error && <Notice tone="red">{error}</Notice>}
      <Field label="Reason (optional)" hint="Saved in the audit log, e.g. Posted to another school.">
        <Textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Dialog>
  );
}

// Shows a new temporary password once, with how to hand it over safely.
function TemporaryPasswordDialog({ issued, onHide }) {
  const [copied, setCopied] = useState(false);
  const { account, temporary_password: password } = issued;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title={issued.reason === "created" ? "Account created" : "Password reset"}
      icon="bi-key"
      footer={<Button onClick={onHide}>Done</Button>}
    >
      <p className={styles.explain}>
        Give this temporary password to <strong>{account.name}</strong> privately, for example by phone or in person. It is
        shown only now. They will choose their own password when they sign in.
      </p>
      <div className={styles.password}>
        <code>{password}</code>
        <Button variant="ghost" size="sm" icon={copied ? "bi-check2" : "bi-clipboard"} onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className={styles.handover}>
        <div>
          Sign-in email: <strong>{account.email}</strong>
        </div>
        {issued.contact_phone && <PhoneLinks phone={issued.contact_phone} label="They asked to be called on" />}
        <PhoneLinks phone={account.phone} whatsapp={account.whatsapp} label="Call them" />
        <EmailLink email={account.email} />
      </div>
      <Notice tone="amber">Do not send the password in the same email as the sign-in address.</Notice>
    </Dialog>
  );
}
