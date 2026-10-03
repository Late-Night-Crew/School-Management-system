import { useCallback } from "react";
import { Link } from "react-router-dom";

import { getActiveAcademicYear } from "../../api/academicYears";
import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { getSchoolReport } from "../../api/reports";
import useAsync from "../../hooks/useAsync";
import { formatDate, formatNumber } from "../../utils/format";
import DataState from "../../components/DataState";
import { Button, Card, Notice, Page, StatTile, Table } from "../../components/ui";

const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);

const QUICK_ACTIONS = [
  { to: "/admin/manageschools", icon: "bi-building", tone: "blue", title: "Manage schools", sub: "Add, edit or remove schools" },
  { to: "/admin/manageacademicyear", icon: "bi-calendar4-week", tone: "green", title: "Academic years", sub: "Set up and activate school years" },
  { to: "/admin/transfers", icon: "bi-arrow-left-right", tone: "amber", title: "Review transfers", sub: "Approve, reject or finalize requests" },
  { to: "/admin/reports", icon: "bi-file-earmark-text", tone: "purple", title: "Reports", sub: "National summary with exports" },
];

export default function AdminDashboard() {
  const overview = useAsync(
    useCallback(
      () => Promise.all([getSchoolReport(), listRegions(), listDistricts(), getActiveAcademicYear()]),
      []
    )
  );
  const [schools = [], regions = [], districts = [], activeYear] = overview.data || [];

  // Students and pending transfers per region, from the per-school report rows
  const byRegion = regions
    .map((region) => {
      const rows = schools.filter((s) => s.region_id === region.id);
      return {
        ...region,
        schoolCount: rows.length,
        studentCount: sum(rows, "student_count"),
        pendingIn: sum(rows, "pending_in"),
      };
    })
    .sort((a, b) => b.studentCount - a.studentCount);

  const loading = overview.loading;

  return (
    <Page icon="bi-speedometer2" title="Admin Dashboard" subtitle="National education overview.">
      {overview.error && <Notice tone="red">{overview.error}</Notice>}

      <div className="ui-grid ui-cols-4">
        <StatTile
          label="Students"
          value={formatNumber(sum(schools, "student_count"))}
          icon="bi-people-fill"
          tone="blue"
          detail={`${formatNumber(sum(schools, "disability_count"))} with a disability`}
          loading={loading}
        />
        <StatTile
          label="Schools"
          value={formatNumber(schools.length)}
          icon="bi-building-fill"
          tone="green"
          detail={`${regions.length} divisions · ${districts.length} districts`}
          loading={loading}
        />
        <StatTile
          label="Pending Transfers"
          value={formatNumber(sum(schools, "pending_in"))}
          icon="bi-arrow-left-right"
          tone="amber"
          detail="Awaiting the receiving school"
          loading={loading}
        />
        <StatTile
          label="Academic Year"
          value={activeYear ? activeYear.year : "None active"}
          icon="bi-calendar-check"
          tone="purple"
          detail={activeYear && `${formatDate(activeYear.start_date)} – ${formatDate(activeYear.end_date)}`}
          loading={loading}
        />
      </div>

      <div className="ui-split">
        <Card
          accent="blue"
          icon="bi-diagram-3"
          title="Divisions"
          subtitle="Schools, students and pending transfers per division"
          actions={
            <Button variant="ghost" size="sm" icon="bi-file-earmark-text" to="/admin/reports">
              Full report
            </Button>
          }
          flush
        >
          <DataState
            loading={loading}
            error={overview.error}
            onRetry={overview.reload}
            empty={byRegion.length === 0}
            emptyMessage="No divisions set up yet."
          >
            <Table>
              <thead>
                <tr>
                  <th>Division</th>
                  <th className="num">Schools</th>
                  <th className="num">Students</th>
                  <th className="num">Pending Transfers</th>
                </tr>
              </thead>
              <tbody>
                {byRegion.map((r) => (
                  <tr key={r.id}>
                    <td className="strong">{r.name}</td>
                    <td className="num">{formatNumber(r.schoolCount)}</td>
                    <td className="num">{formatNumber(r.studentCount)}</td>
                    <td className="num">{formatNumber(r.pendingIn)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataState>
        </Card>

        <Card accent="purple" icon="bi-lightning-charge" title="Quick Actions" subtitle="Common administration tasks">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} className="ui-action-link" to={action.to}>
              <div className={`ui-card-icon ui-tone-${action.tone}`}>
                <i className={`bi ${action.icon}`} />
              </div>
              <div>
                <div className="ui-action-link-title">{action.title}</div>
                <div className="ui-action-link-sub">{action.sub}</div>
              </div>
              <i className="bi bi-chevron-right" />
            </Link>
          ))}
        </Card>
      </div>
    </Page>
  );
}
