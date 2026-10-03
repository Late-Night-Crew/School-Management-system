import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { listRegionTransfers } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { formatDate } from "../../utils/format";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import { Card, Field, Page, Person, SearchInput, Select, Table } from "../../components/ui";
import styles from "./RegionalTransfers.module.css";

const STATUSES = ["Pending", "Accepted", "Completed", "Rejected"];

export default function RegionalTransfers() {
  const { regionId } = useParams();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data: transfers = [], loading, error, reload } = useAsync(
    useCallback(() => listRegionTransfers(regionId), [regionId])
  );

  const term = search.trim().toLowerCase();
  const visibleTransfers = transfers.filter(
    (t) =>
      (!status || t.status === status) &&
      `${t.student_name} ${t.student_number} ${t.from_school_name} ${t.to_school_name}`.toLowerCase().includes(term)
  );
  const { page, pageCount, pageItems, setPage } = usePagination(visibleTransfers, 25);
  const countFor = (value) => transfers.filter((t) => t.status === value).length;

  return (
    <Page
      icon="bi-arrow-left-right"
      title="Transfer Requests"
      subtitle="Transfers into or out of schools in your region. The receiving school approves or rejects each request; the sending school finalizes it."
      stats={[
        { label: "Transfers", value: loading ? null : transfers.length },
        { label: "Pending", value: loading ? null : countFor("Pending") },
      ]}
    >
      <Card accent="slate" icon="bi-funnel" title="Filters">
        <div className="ui-grid ui-cols-2">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All ({transfers.length})</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s} ({countFor(s)})</option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="Student or school" />
          </Field>
        </div>
      </Card>

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Transfers"
        subtitle={loading ? null : `${visibleTransfers.length} of ${transfers.length} shown`}
        flush
      >
        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={visibleTransfers.length === 0}
          emptyMessage="No transfers match these filters."
        >
          <Table>
            <thead>
              <tr>
                <th>Student</th>
                <th>From</th>
                <th>To</th>
                <th>Initiated</th>
                <th>Accepted</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id}>
                  <td><Person name={t.student_name} sub={t.student_number} /></td>
                  <td>{t.from_school_name}</td>
                  <td>{t.to_school_name}</td>
                  <td className={styles.date}>{formatDate(t.date_initiated)}</td>
                  <td className={styles.date}>{formatDate(t.date_accepted)}</td>
                  <td><TransferStatusBadge status={t.status} /></td>
                  <td>
                    {t.reason || "-"}
                    {t.rejection_reason && <div className={styles.rejection}>Rejected: {t.rejection_reason}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
        </DataState>
      </Card>
    </Page>
  );
}
