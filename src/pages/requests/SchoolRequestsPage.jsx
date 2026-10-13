import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listSchoolRequests } from "../../api/schoolRequests";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import { Badge, Button, Card, IconButton, Page, SearchInput, Table } from "../../components/ui";
import { ROLES, getSession } from "../../auth/session";
import { formatDate } from "../../utils/format";
import { STATUS_TONES, requestsBase } from "./shared";

// The division sees its drafts; the super admin only sees requests once submitted
const TABS = {
  [ROLES.SUPER_ADMIN]: [
    { key: "Submitted", label: "Awaiting decision", icon: "bi-hourglass-split" },
    { key: "Accepted", label: "Accepted", icon: "bi-check-circle" },
  ],
  [ROLES.REGIONAL_ADMIN]: [
    { key: "all", label: "All", icon: "bi-list-ul" },
    { key: "Draft", label: "Drafts", icon: "bi-pencil" },
    { key: "Submitted", label: "Submitted", icon: "bi-send" },
    { key: "Accepted", label: "Accepted", icon: "bi-check-circle" },
  ],
};

// Requests to register a new school. Division officers fill them in for schools in
// their division; the super admin accepts them.
export default function SchoolRequestsPage() {
  const session = getSession();
  const isSuper = session.role === ROLES.SUPER_ADMIN;
  const base = requestsBase(session);
  const navigate = useNavigate();
  const tabs = TABS[session.role];
  const [tab, setTab] = useState(tabs[0].key);
  const [search, setSearch] = useState("");

  const requests = useAsync(useCallback(() => listSchoolRequests(), []));
  const all = (requests.data || []).filter((r) => !isSuper || r.status !== "Draft");
  const count = (status) => all.filter((r) => r.status === status).length;
  const term = search.trim().toLowerCase();
  const visible = all.filter(
    (r) =>
      (tab === "all" || r.status === tab) &&
      [r.school_name, r.district_name, r.region_name, r.registration_number].some((v) => (v || "").toLowerCase().includes(term))
  );

  return (
    <Page
      icon="bi-building-add"
      title="School Requests"
      subtitle={
        isSuper
          ? "Requests from division offices to register a new Open Secondary School. Accept to register the school and create the coordinator's account."
          : "Register a new Open Secondary School: fill in the registration form, download a copy, and submit it to MCDE."
      }
      stats={[
        { label: isSuper ? "Awaiting" : "Submitted", value: requests.loading ? null : count("Submitted") },
        { label: "Accepted", value: requests.loading ? null : count("Accepted") },
      ]}
      actions={
        !isSuper && (
          <Button variant="ghost" icon="bi-plus-lg" to={`${base}/new`}>
            New Request
          </Button>
        )
      }
      tabs={tabs.map((t) => ({ ...t, count: t.key === "all" ? all.length : count(t.key) }))}
      activeTab={tab}
      onTabChange={setTab}
    >
      <Card
        accent="blue"
        icon="bi-list-ul"
        title={tabs.find((t) => t.key === tab).label}
        subtitle={`${visible.length} request${visible.length === 1 ? "" : "s"}`}
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search by school or district…" />}
        flush
      >
        <DataState
          loading={requests.loading}
          error={requests.error}
          onRetry={requests.reload}
          empty={visible.length === 0}
          emptyIcon="bi-building-add"
          emptyMessage={
            search
              ? "No requests match your search."
              : isSuper && tab === "Submitted"
                ? "No requests are waiting for a decision."
                : "No requests here yet."
          }
        >
          <Table>
            <thead>
              <tr>
                <th>School</th>
                <th>District</th>
                {isSuper && <th>Division</th>}
                <th>Status</th>
                <th>Submitted</th>
                <th>Outcome</th>
                <th className="end">Open</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`${base}/${r.id}`)}>
                  <td className="strong">{r.school_name || <span className="text-muted">Untitled draft</span>}</td>
                  <td>{r.district_name || "-"}</td>
                  {isSuper && <td>{r.region_name || "-"}</td>}
                  <td>
                    <Badge tone={STATUS_TONES[r.status]}>{r.status}</Badge>
                  </td>
                  <td>
                    {r.submitted_at ? (
                      <>
                        {formatDate(r.submitted_at)}
                        <div className="ui-hint">{r.submitted_by_name}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {r.status === "Accepted" && <Badge tone="blue">{r.registration_number}</Badge>}
                    {r.status !== "Accepted" && "-"}
                  </td>
                  <td className="end" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      kind="view"
                      title={`Open the request for ${r.school_name || "this draft"}`}
                      tip="Open request"
                      to={`${base}/${r.id}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>
    </Page>
  );
}
