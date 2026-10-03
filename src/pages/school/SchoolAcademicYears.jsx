import { useEffect, useState } from "react";

import { listAcademicYears } from "../../api/academicYears";
import { formatDate } from "../../utils/format";
import DataState from "../../components/DataState";
import { Badge, Card, Notice, Page, StatTile, Table } from "../../components/ui";

const STATUS_TONES = { Active: "green", Upcoming: "amber", Completed: "slate" };

// Academic years are set nationally by the super admin; schools can only view them.
export default function SchoolAcademicYears() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const years = await listAcademicYears();
        setRecords([...years].sort((a, b) => b.year - a.year));
      } catch (err) {
        console.error(err);
        setError("Could not load academic years. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countByStatus = (status) => records.filter((r) => r.status === status).length;
  const activeYear = records.find((r) => r.status === "Active");

  return (
    <Page
      icon="bi-calendar3"
      title="Academic Years"
      subtitle="Set by the Ministry. Contact the system administrator to request changes."
    >
      <div className="ui-grid ui-cols-4">
        <StatTile label="Total Years" value={records.length} icon="bi-stack" tone="blue" loading={loading} />
        <StatTile label="Active" value={countByStatus("Active")} icon="bi-play-circle-fill" tone="green" loading={loading} />
        <StatTile label="Upcoming" value={countByStatus("Upcoming")} icon="bi-clock-fill" tone="amber" loading={loading} />
        <StatTile label="Completed" value={countByStatus("Completed")} icon="bi-check-circle-fill" tone="slate" loading={loading} />
      </div>

      {!loading &&
        !error &&
        (activeYear ? (
          <Notice tone="blue" icon="bi-calendar-check-fill">
            <span>
              <strong>Current academic year: {activeYear.year}</strong>
              &nbsp;·&nbsp;{formatDate(activeYear.start_date)} → {formatDate(activeYear.end_date)}
            </span>
          </Notice>
        ) : (
          <Notice tone="amber">No academic year is active. Student registration needs an active academic year.</Notice>
        ))}

      <Card
        accent="blue"
        icon="bi-calendar3"
        title="Academic Year Records"
        subtitle={`${records.length} total record${records.length !== 1 ? "s" : ""}`}
        flush
      >
        <DataState
          loading={loading}
          error={error}
          empty={records.length === 0}
          emptyIcon="bi-calendar-x"
          emptyMessage="The system administrator has not set up any academic years."
        >
          <Table>
            <thead>
              <tr>
                <th>#</th>
                <th>Year</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr key={rec.id}>
                  <td>{String(idx + 1).padStart(2, "0")}</td>
                  <td className="strong">{rec.year}</td>
                  <td>
                    {formatDate(rec.start_date)} → {formatDate(rec.end_date)}
                  </td>
                  <td>
                    <Badge tone={STATUS_TONES[rec.status] || "slate"}>{rec.status || "Unknown"}</Badge>
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
