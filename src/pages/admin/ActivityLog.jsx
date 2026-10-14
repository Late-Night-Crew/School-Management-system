import { useCallback, useEffect, useState } from "react";

import { listAuditActors, listAuditLogs } from "../../api/audit";
import { ROLE_LABELS, ROLES } from "../../auth/session";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import useAsync from "../../hooks/useAsync";
import { Badge, Button, Card, Field, Input, Notice, Page, SearchInput, Select, Switch, Table } from "../../components/ui";
import { formatDate } from "../../utils/format";

const PAGE_SIZE = 50;
const EXPORT_LIMIT = 5000;
// Sign-ins are frequent, so they are hidden unless asked for
const NO_FILTERS = { actor_user_id: "", actor_role: "", entity_type: "", from: "", to: "", q: "", show_sign_ins: "" };
const DATE_TIME = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

// What an entry is about, in words people use
const ENTITY_LABELS = {
  school: "School",
  school_request: "School request",
  student: "Learner",
  user: "Account",
  region: "Division",
  district: "District",
  academic_year: "Academic year",
  transfer: "Transfer",
  notice: "Notice",
  grading_scale: "Grading scale",
  promotion_settings: "Promotion settings",
  reminder_settings: "Reminder settings",
  reminders: "Term reminders",
  conversation: "Message",
  subject: "Subject",
};
const ROLE_TONES = { [ROLES.SUPER_ADMIN]: "purple", [ROLES.REGIONAL_ADMIN]: "blue", [ROLES.SCHOOL_MANAGER]: "green" };

// "PasswordResetRequested" -> "Password reset requested"
const actionText = (action) => {
  const words = action.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
const entityText = (type) => ENTITY_LABELS[type] || actionText(type.replace(/_/g, " "));
// Stored in UTC
const when = (at) => formatDate(at, DATE_TIME);

// Names, notes and reasons are typed by users: a cell starting with = + - @ would run
// as a formula in Excel, so it is prefixed with ' to stay text
const csvCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function downloadCsv(entries) {
  const rows = [
    ["When", "Who", "Role", "Action", "Type", "About", "Note"],
    ...entries.map((e) => [
      when(e.at),
      e.actor_name || "System",
      ROLE_LABELS[e.actor_role] || e.actor_role,
      actionText(e.action),
      entityText(e.entity_type),
      e.entity_label,
      e.note,
    ]),
  ];
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Everything people have done in the system, newest first, so MCDE can see which
// admin did what.
export default function ActivityLog() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  // Search after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.q === search ? f : { ...f, q: search }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const actors = useAsync(useCallback(() => listAuditActors(), []));
  const log = useAsync(useCallback(() => listAuditLogs({ ...filters, page, page_size: PAGE_SIZE }), [filters, page]));

  const set = (name) => (e) => {
    setFilters((f) => ({ ...f, [name]: e.target.value }));
    setPage(1);
  };
  const clear = () => {
    setFilters(NO_FILTERS);
    setSearch("");
    setPage(1);
  };
  const filtered = Object.values(filters).some(Boolean);

  const exportCsv = async () => {
    setExporting(true);
    setExportError("");
    try {
      const result = await listAuditLogs({ ...filters, page: 1, page_size: EXPORT_LIMIT });
      downloadCsv(result.entries);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const entries = log.data?.entries || [];
  const total = log.data?.total || 0;
  const people = (actors.data || []).filter((a) => !filters.actor_role || a.role === filters.actor_role);

  return (
    <Page
      icon="bi-clock-history"
      title="Activity Log"
      subtitle="Who did what, and when. Every change made in the system is recorded here with the name of the person who made it."
      actions={
        <Button variant="ghost" icon="bi-download" onClick={exportCsv} disabled={exporting || !total}>
          {exporting ? "Preparing…" : "Download CSV"}
        </Button>
      }
    >
      <div className="ui-grid">
        <Card accent="blue" icon="bi-funnel" title="Filter">
          <div className="ui-grid ui-cols-3">
            <Field label="Role">
              <Select value={filters.actor_role} onChange={set("actor_role")}>
                <option value="">All roles</option>
                <option value={ROLES.SUPER_ADMIN}>{ROLE_LABELS[ROLES.SUPER_ADMIN]} (MCDE)</option>
                <option value={ROLES.REGIONAL_ADMIN}>{ROLE_LABELS[ROLES.REGIONAL_ADMIN]}</option>
                <option value={ROLES.SCHOOL_MANAGER}>{ROLE_LABELS[ROLES.SCHOOL_MANAGER]}</option>
              </Select>
            </Field>
            <Field label="Person">
              <Select value={filters.actor_user_id} onChange={set("actor_user_id")}>
                <option value="">Everyone</option>
                {people.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.entries})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="About">
              <Select value={filters.entity_type} onChange={set("entity_type")}>
                <option value="">Anything</option>
                {Object.entries(ENTITY_LABELS).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={filters.from} max={filters.to || undefined} onChange={set("from")} />
            </Field>
            <Field label="To">
              <Input type="date" value={filters.to} min={filters.from || undefined} onChange={set("to")} />
            </Field>
            <Field label="Search">
              <SearchInput value={search} onChange={setSearch} placeholder="Name, action or note…" />
            </Field>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Switch
              checked={Boolean(filters.show_sign_ins)}
              onChange={(on) => {
                setFilters((f) => ({ ...f, show_sign_ins: on ? "true" : "" }));
                setPage(1);
              }}
            >
              Show sign-ins
            </Switch>
            {filtered && (
              <Button size="sm" variant="ghost" icon="bi-x-circle" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
        </Card>

        {exportError && <Notice tone="red">{exportError}</Notice>}
        {total > EXPORT_LIMIT && (
          <Notice tone="amber">
            The download holds the newest {EXPORT_LIMIT.toLocaleString()} of {total.toLocaleString()} entries. Narrow the
            dates to download the rest.
          </Notice>
        )}

        <Card
          accent="purple"
          icon="bi-clock-history"
          title="Entries"
          subtitle={log.data ? `${total.toLocaleString()} ${total === 1 ? "entry" : "entries"}${filtered ? " match" : ""}` : undefined}
          flush
        >
          <DataState
            loading={log.loading}
            error={log.error}
            onRetry={log.reload}
            empty={!entries.length}
            emptyMessage={filtered ? "Nothing matches these filters." : "Nothing has been recorded yet."}
          >
            <Table compact>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>About</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{when(e.at)}</td>
                    <td>
                      <div className="strong">{e.actor_name || "System"}</div>
                      {e.actor_role && (
                        <Badge tone={ROLE_TONES[e.actor_role] || "slate"}>{ROLE_LABELS[e.actor_role] || e.actor_role}</Badge>
                      )}
                    </td>
                    <td>{actionText(e.action)}</td>
                    <td>
                      <div className="ui-hint">{entityText(e.entity_type)}</div>
                      <div>{e.entity_label || (e.entity_id ? `#${e.entity_id}` : "-")}</div>
                    </td>
                    <td style={{ maxWidth: 320 }}>{e.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <TablePagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
          </DataState>
        </Card>
      </div>
    </Page>
  );
}
