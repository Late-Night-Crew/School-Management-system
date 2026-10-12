import { useCallback, useEffect, useState } from "react";

import {
  approveTransfer,
  createTransfer,
  exportTransferHistory,
  finalizeTransfer,
  getTransferAudit,
  listTransferHistory,
  rejectTransfer,
} from "../../api/transfers";
import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import { listStudents } from "../../api/students";
import { ROLE_LABELS, ROLES } from "../../auth/session";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import TablePagination from "../../components/TablePagination";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import {
  Badge,
  Button,
  Card,
  Dialog,
  Field,
  IconButton,
  Input,
  Notice,
  Page,
  Person,
  SearchInput,
  Segmented,
  Select,
  Table,
  Textarea,
} from "../../components/ui";
import styles from "./AdminTransfers.module.css";

const TABS = [
  { key: "history", label: "All Transfers", icon: "bi-clock-history" },
  { key: "create", label: "New Transfer", icon: "bi-plus-circle" },
];
const STATUSES = ["Pending", "Accepted", "Completed", "Rejected"];
const PAGE_SIZE = 25;
const NO_FILTERS = { status: "", region_id: "", district_id: "", school_id: "", date_from: "", date_to: "", search: "" };
const NOTICE_TONES = { success: "green", warning: "amber", danger: "red" };
const DATE_TIME = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

const emptyForm = () => ({
  student_id: "",
  from_school: "",
  to_school: "",
  date_initiated: new Date().toISOString().split("T")[0],
  reason: "",
});

export default function AdminTransfers() {
  const [activeTab, setActiveTab] = useState("history");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null); // { type: "approve" | "reject" | "finalize", transfer }
  const [detail, setDetail] = useState(null); // transfer whose audit trail is open
  const [alertState, setAlertState] = useState({ show: false, variant: "success", message: "" });

  const showAlert = (variant, message) => {
    setAlertState({ show: true, variant, message });
    setTimeout(() => setAlertState({ show: false, variant: "", message: "" }), 4000);
  };

  // Any filter change goes back to the first page
  const updateFilters = useCallback((changes) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  }, []);

  const history = useAsync(
    useCallback(() => listTransferHistory({ ...filters, page, page_size: PAGE_SIZE }), [filters, page])
  );

  const handleCreated = () => {
    showAlert("success", "Transfer request created. It is waiting for the receiving school's decision.");
    updateFilters({ ...NO_FILTERS, status: "Pending" });
    setActiveTab("history");
  };

  const handleActionDone = (message) => {
    showAlert("success", message);
    setAction(null);
    history.reload();
  };

  const pendingCount = history.data?.status_counts?.Pending;

  return (
    <Page
      icon="bi-arrow-left-right"
      title="Student Transfers"
      subtitle="Every transfer between schools, with who approved, rejected or completed it. Create a transfer on any school's behalf from New Transfer."
      stats={[
        { label: "Matching", value: history.loading ? null : history.data?.total },
        { label: "Pending", value: history.loading ? null : pendingCount },
      ]}
      tabs={TABS.map((tab) => (tab.key === "history" ? { ...tab, count: pendingCount || null } : tab))}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {alertState.show && (
        <Notice tone={NOTICE_TONES[alertState.variant]}>
          <span>{alertState.message}</span>
          <Button variant="ghost" size="sm" icon="bi-x-lg" onClick={() => setAlertState({ ...alertState, show: false })}>
            Dismiss
          </Button>
        </Notice>
      )}

      {activeTab === "history" && (
        <TransferHistory
          filters={filters}
          onFiltersChange={updateFilters}
          history={history}
          page={page}
          onPageChange={setPage}
          onAction={(type, transfer) => setAction({ type, transfer })}
          onView={setDetail}
          onError={(message) => showAlert("danger", message)}
        />
      )}

      {activeTab === "create" && <CreateTransferForm onCreated={handleCreated} onError={(m) => showAlert("danger", m)} />}

      {action && <ActionDialog action={action} onHide={() => setAction(null)} onDone={handleActionDone} />}
      {detail && <AuditTrailDialog transfer={detail} onHide={() => setDetail(null)} />}
    </Page>
  );
}

function TransferHistory({ filters, onFiltersChange, history, page, onPageChange, onAction, onView, onError }) {
  const [searchText, setSearchText] = useState(filters.search);
  const [exporting, setExporting] = useState(false);

  const { data: places } = useAsync(
    useCallback(() => Promise.all([listRegions(), listDistricts(), listSchools()]), [])
  );
  const [regions = [], districts = [], schools = []] = places || [];

  // Search after the user stops typing rather than on every key
  useEffect(() => {
    const search = searchText.trim();
    if (search === filters.search) return undefined;
    const timer = setTimeout(() => onFiltersChange({ search }), 350);
    return () => clearTimeout(timer);
  }, [searchText, filters.search, onFiltersChange]);

  // Lower levels only list places inside the chosen higher level
  const visibleDistricts = districts.filter((d) => !filters.region_id || d.region_id === Number(filters.region_id));
  const districtIds = new Set(visibleDistricts.map((d) => d.id));
  const visibleSchools = schools.filter((s) =>
    filters.district_id ? s.district_id === Number(filters.district_id) : districtIds.has(s.district_id)
  );

  const result = history.data;
  const counts = result?.status_counts || {};
  const allCount = STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);
  const pageCount = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const hasFilters = Object.values(filters).some(Boolean);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTransferHistory(filters);
    } catch (error) {
      onError(error.message);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchText("");
    onFiltersChange(NO_FILTERS);
  };

  return (
    <>
      <Card
        accent="slate"
        icon="bi-funnel"
        title="Filters"
        subtitle="A region, district or school matches transfers on either side: leaving or joining it"
        actions={
          hasFilters && (
            <Button variant="ghost" size="sm" icon="bi-x-circle" onClick={clearFilters}>
              Clear filters
            </Button>
          )
        }
      >
        <div className={styles.statusRow}>
          <Segmented
            value={filters.status}
            onChange={(status) => onFiltersChange({ status })}
            options={[
              { value: "", label: `All (${allCount})` },
              ...STATUSES.map((status) => ({ value: status, label: `${status} (${counts[status] || 0})` })),
            ]}
          />
        </div>
        <div className="ui-grid ui-cols-3">
          <Field label="Region">
            <Select
              value={filters.region_id}
              onChange={(e) => onFiltersChange({ region_id: e.target.value, district_id: "", school_id: "" })}
            >
              <option value="">All regions</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District">
            <Select
              value={filters.district_id}
              onChange={(e) => onFiltersChange({ district_id: e.target.value, school_id: "" })}
            >
              <option value="">All districts</option>
              {visibleDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="School">
            <Select value={filters.school_id} onChange={(e) => onFiltersChange({ school_id: e.target.value })}>
              <option value="">All schools</option>
              {visibleSchools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Initiated from">
            <Input
              type="date"
              value={filters.date_from}
              max={filters.date_to || undefined}
              onChange={(e) => onFiltersChange({ date_from: e.target.value })}
            />
          </Field>
          <Field label="Initiated to">
            <Input
              type="date"
              value={filters.date_to}
              min={filters.date_from || undefined}
              onChange={(e) => onFiltersChange({ date_to: e.target.value })}
            />
          </Field>
          <Field label="Student">
            <SearchInput value={searchText} onChange={setSearchText} placeholder="Name or student number" />
          </Field>
        </div>
      </Card>

      <Card
        accent="blue"
        icon="bi-clock-history"
        title="Transfer History"
        subtitle={result ? `${result.total} transfer${result.total === 1 ? "" : "s"} match these filters` : null}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon="bi-download"
            onClick={handleExport}
            disabled={exporting || !result?.total}
            title="Download every matching transfer as a CSV file (opens in Excel)"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
        flush
      >
        <DataState
          loading={history.loading}
          error={history.error}
          onRetry={history.reload}
          empty={result?.items.length === 0}
          emptyIcon="bi-arrow-left-right"
          emptyMessage={hasFilters ? "No transfers match these filters." : "No transfers have been made yet."}
        >
          <Table>
            <thead>
              <tr>
                <th>Student</th>
                <th>From</th>
                <th>To</th>
                <th>Initiated</th>
                <th>Status</th>
                <th>Decision</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result?.items.map((transfer) => (
                <tr key={transfer.id}>
                  <td>
                    <Person name={transfer.student_name} sub={transfer.student_number} />
                  </td>
                  <td>
                    <SchoolCell
                      name={transfer.from_school_name}
                      district={transfer.from_district_name}
                      region={transfer.from_region_name}
                    />
                  </td>
                  <td>
                    <SchoolCell
                      name={transfer.to_school_name}
                      district={transfer.to_district_name}
                      region={transfer.to_region_name}
                    />
                  </td>
                  <td className={styles.nowrap}>{formatDate(transfer.date_initiated)}</td>
                  <td>
                    <TransferStatusBadge status={transfer.status} />
                  </td>
                  <td>
                    <DecisionCell transfer={transfer} />
                  </td>
                  <td className="end">
                    <div className={styles.actions}>
                      <RowActions transfer={transfer} onAction={onAction} />
                      <IconButton kind="view" icon="bi-clock-history" title="View audit trail" onClick={() => onView(transfer)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={page} pageCount={pageCount} onChange={onPageChange} />
        </DataState>
      </Card>
    </>
  );
}

function SchoolCell({ name, district, region }) {
  return (
    <>
      <div>{name}</div>
      <div className={styles.sub}>
        {district} · {region}
      </div>
    </>
  );
}

// Who decided the transfer (approved or rejected) and, once completed, when.
function DecisionCell({ transfer }) {
  const { decision, completion } = transfer;
  if (!decision) {
    return <span className={styles.sub}>{transfer.status === "Pending" ? "Awaiting decision" : "Not recorded"}</span>;
  }
  return (
    <>
      <div>
        {decision.action} by {decision.actor_name || "unknown"}
        {decision.actor_role === ROLES.SUPER_ADMIN && (
          <>
            {" "}
            <Badge tone="purple">Admin override</Badge>
          </>
        )}
      </div>
      <div className={styles.sub}>{formatDate(decision.at)}</div>
      {decision.note && <div className={styles.note}>“{decision.note}”</div>}
      {completion && <div className={styles.sub}>Completed {formatDate(completion.at)}</div>}
    </>
  );
}

function RowActions({ transfer, onAction }) {
  if (transfer.status === "Pending") {
    return (
      <>
        <Button variant="success" size="sm" icon="bi-check-circle" onClick={() => onAction("approve", transfer)}>
          Approve
        </Button>
        <Button variant="danger" size="sm" icon="bi-x-circle" onClick={() => onAction("reject", transfer)}>
          Reject
        </Button>
      </>
    );
  }
  if (transfer.status === "Accepted") {
    return (
      <Button size="sm" icon="bi-check2-circle" onClick={() => onAction("finalize", transfer)}>
        Finalize
      </Button>
    );
  }
  return null;
}

const ACTIONS = {
  approve: {
    title: "Approve Transfer",
    icon: "bi-check-circle",
    variant: "success",
    label: "Approve",
    busy: "Approving…",
    done: "Transfer approved. The student has moved to the receiving school.",
    noteLabel: "Approval note",
    noteRequired: true,
    placeholder: "Why are you approving on the school's behalf? e.g. Head teacher confirmed by phone",
    explain: (t) =>
      `You are approving on behalf of ${t.to_school_name}. ${t.student_name} moves to that school straight away. ` +
      "Your name and note are saved in the audit trail.",
    run: (t, note) => approveTransfer(t.id, note),
  },
  reject: {
    title: "Reject Transfer",
    icon: "bi-x-circle",
    variant: "danger",
    label: "Reject",
    busy: "Rejecting…",
    done: "Transfer rejected.",
    noteLabel: "Rejection reason",
    noteRequired: true,
    placeholder: "Why is this transfer being rejected?",
    explain: (t) =>
      `${t.student_name} stays at ${t.from_school_name}. Both schools see the reason, and it is saved in the audit trail with your name.`,
    run: (t, note) => rejectTransfer(t.id, note),
  },
  finalize: {
    title: "Finalize Transfer",
    icon: "bi-check2-circle",
    variant: "primary",
    label: "Finalize",
    busy: "Finalizing…",
    done: "Transfer finalized.",
    noteLabel: "Note (optional)",
    noteRequired: false,
    placeholder: "Anything to record about completing this transfer",
    explain: (t) =>
      `Marks the transfer of ${t.student_name} to ${t.to_school_name} as completed. This is normally done by the sending school.`,
    run: (t, note) => finalizeTransfer(t.id, note),
  },
};

function ActionDialog({ action, onHide, onDone }) {
  const config = ACTIONS[action.type];
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const missingNote = config.noteRequired && !note.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (missingNote) return;
    setSaving(true);
    setError("");
    try {
      await config.run(action.transfer, note.trim());
      onDone(config.done);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title={config.title}
      icon={config.icon}
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant={config.variant} icon={config.icon} disabled={saving || missingNote}>
            {saving ? config.busy : config.label}
          </Button>
        </>
      }
    >
      <p className={styles.explain}>{config.explain(action.transfer)}</p>
      {error && <Notice tone="red">{error}</Notice>}
      <Field label={config.noteLabel} required={config.noteRequired}>
        <Textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={config.placeholder}
          required={config.noteRequired}
          autoFocus
        />
      </Field>
    </Dialog>
  );
}

const TIMELINE_ICONS = {
  Created: { icon: "bi-send", tone: "blue" },
  Approved: { icon: "bi-check-circle", tone: "green" },
  Rejected: { icon: "bi-x-circle", tone: "red" },
  Completed: { icon: "bi-check2-all", tone: "green" },
};

function AuditTrailDialog({ transfer, onHide }) {
  const { data: entries = [], loading, error, reload } = useAsync(
    useCallback(() => getTransferAudit(transfer.id), [transfer.id])
  );

  return (
    <Dialog show onHide={onHide} title="Transfer Audit Trail" icon="bi-clock-history" size="lg">
      <div className={styles.detailGrid}>
        <DetailRow label="Student" value={`${transfer.student_name} (${transfer.student_number})`} />
        <DetailRow label="Status" value={<TransferStatusBadge status={transfer.status} />} />
        <DetailRow label="From" value={`${transfer.from_school_name}, ${transfer.from_district_name}`} />
        <DetailRow label="To" value={`${transfer.to_school_name}, ${transfer.to_district_name}`} />
        <DetailRow label="Reason" value={transfer.reason} />
        {transfer.rejection_reason && <DetailRow label="Rejection reason" value={transfer.rejection_reason} />}
      </div>

      <h3 className={styles.timelineTitle}>What happened</h3>
      <DataState loading={loading} error={error} onRetry={reload} empty={entries.length === 0} emptyMessage="No actions recorded.">
        <ol className={styles.timeline}>
          {entries.map((entry) => {
            const look = TIMELINE_ICONS[entry.action] || { icon: "bi-dot", tone: "slate" };
            const meta = [ROLE_LABELS[entry.actor_role] || entry.actor_role, entry.actor_school_name, formatDate(entry.at, DATE_TIME)];
            return (
              <li key={entry.id} className={styles.event}>
                <span className={`${styles.eventIcon} ui-tone-${look.tone}`}>
                  <i className={`bi ${look.icon}`} />
                </span>
                <div>
                  <div className={styles.eventTitle}>
                    {entry.action} by {entry.actor_name || <span className={styles.sub}>person not recorded</span>}
                    {entry.actor_role === ROLES.SUPER_ADMIN && entry.action !== "Created" && (
                      <>
                        {" "}
                        <Badge tone="purple">Admin override</Badge>
                      </>
                    )}
                  </div>
                  <div className={styles.sub}>{meta.filter(Boolean).join(" · ")}</div>
                  {entry.note && <div className={styles.note}>“{entry.note}”</div>}
                </div>
              </li>
            );
          })}
        </ol>
      </DataState>
    </Dialog>
  );
}

function CreateTransferForm({ onCreated, onError }) {
  const [formData, setFormData] = useState(emptyForm);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: lists, loading, error, reload } = useAsync(
    useCallback(() => Promise.all([listStudents(), listSchools()]), [])
  );
  const [students = [], schools = []] = lists || [];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Picking a student fills in their current school as the origin
      if (name === "student_id") {
        const student = students.find((s) => s.id === Number(value));
        if (student?.school_id) next.from_school = String(student.school_id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createTransfer({
        student_id: Number(formData.student_id),
        from_school: Number(formData.from_school),
        to_school: Number(formData.to_school),
        date_initiated: new Date(formData.date_initiated).toISOString(),
        reason: formData.reason,
      });
      setFormData(emptyForm());
      onCreated();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  const complete = formData.student_id && formData.from_school && formData.to_school;
  const sameSchool = complete && formData.from_school === formData.to_school;

  return (
    <Card
      accent="blue"
      icon="bi-send"
      title="New Transfer Request"
      subtitle="Picking a student fills in their current school. The receiving school then approves or rejects it."
      footer={
        !loading &&
        !error && (
          <Button icon="bi-plus-circle" onClick={() => setConfirming(true)} disabled={saving || !complete || sameSchool}>
            Create Transfer
          </Button>
        )
      }
    >
      <DataState loading={loading} error={error} onRetry={reload}>
        <div className="ui-grid ui-cols-2">
          <Field label="Student" required className="ui-span-all">
            <Select name="student_id" value={formData.student_id} onChange={handleFormChange} required>
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} (ID: {student.student_number})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From School" required>
            <Select name="from_school" value={formData.from_school} onChange={handleFormChange} required>
              <option value="">Select origin school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                  {school.closed_at ? " (closed)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To School" required error={sameSchool ? "Choose a different school from the origin" : null}>
            <Select name="to_school" value={formData.to_school} onChange={handleFormChange} required>
              <option value="">Select destination school...</option>
              {/* Closed schools can send students but not receive them */}
              {schools.filter((school) => !school.closed_at).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date Initiated">
            <Input type="date" name="date_initiated" value={formData.date_initiated} onChange={handleFormChange} />
          </Field>
          <Field label="Reason" className="ui-span-all">
            <Textarea
              rows={3}
              name="reason"
              value={formData.reason}
              onChange={handleFormChange}
              placeholder="Enter reason for transfer (optional)"
            />
          </Field>
        </div>
      </DataState>

      <Dialog
        show={confirming}
        onHide={() => setConfirming(false)}
        title="Create Transfer"
        icon="bi-question-circle"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating…" : "Confirm"}
            </Button>
          </>
        }
      >
        <p className={styles.explain}>
          Create a transfer request for this student? It is recorded in the audit trail as created by you.
        </p>
      </Dialog>
    </Card>
  );
}
