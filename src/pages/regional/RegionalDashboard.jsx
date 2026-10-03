import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import { getRegion } from "../../api/regions";
import { getRegionDashboard, listRegionDistricts, listRegionTransfers } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import { formatDate, formatNumber } from "../../utils/format";
import DataState from "../../components/DataState";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import { Button, Card, Notice, Page, StatTile, Table } from "../../components/ui";
import styles from "./RegionalDashboard.module.css";

export default function RegionalDashboard() {
  const { regionId } = useParams();
  const region = useAsync(useCallback(() => getRegion(regionId), [regionId]));
  const stats = useAsync(useCallback(() => getRegionDashboard(regionId), [regionId]));
  const districts = useAsync(useCallback(() => listRegionDistricts(regionId), [regionId]));
  const transfers = useAsync(useCallback(() => listRegionTransfers(regionId), [regionId]));

  const s = stats.data || {};
  const recentTransfers = (transfers.data || []).slice(0, 5);

  return (
    <Page
      icon="bi-speedometer2"
      title={region.data ? `${region.data.name} Region` : "Regional Dashboard"}
      subtitle="Enrolment and transfer activity across the schools in your region."
    >
      {stats.error && <Notice tone="red">{stats.error}</Notice>}

      <div className="ui-grid ui-cols-4">
        <StatTile label="Districts" value={formatNumber(s.district_count)} icon="bi-geo-alt-fill" tone="blue" loading={stats.loading} />
        <StatTile label="Schools" value={formatNumber(s.school_count)} icon="bi-building-fill" tone="purple" loading={stats.loading} />
        <StatTile
          label="Students"
          value={formatNumber(s.student_count)}
          icon="bi-people-fill"
          tone="green"
          detail={stats.data && `${s.male_count} male · ${s.female_count} female · ${s.disability_count} with disability`}
          loading={stats.loading}
        />
        <StatTile
          label="Pending Transfers"
          value={formatNumber(s.pending_transfer_count)}
          icon="bi-arrow-left-right"
          tone="amber"
          detail="Awaiting the receiving school"
          loading={stats.loading}
        />
      </div>

      <div className="ui-grid ui-cols-2">
        <Card
          accent="blue"
          icon="bi-geo-alt"
          title="Districts"
          subtitle="Schools and students per district"
          actions={<Button variant="ghost" size="sm" to={`/regional/${regionId}/districts`}>View all</Button>}
          flush
        >
          <DataState
            loading={districts.loading}
            error={districts.error}
            onRetry={districts.reload}
            empty={!districts.data?.length}
            emptyMessage="No districts in this region yet."
          >
            <Table compact>
              <thead>
                <tr>
                  <th>District</th>
                  <th className="num">Schools</th>
                  <th className="num">Students</th>
                </tr>
              </thead>
              <tbody>
                {districts.data?.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link className={styles.districtLink} to={`/regional/${regionId}/schools?district=${d.id}`}>
                        {d.name}
                      </Link>
                    </td>
                    <td className="num">{formatNumber(d.school_count)}</td>
                    <td className="num">{formatNumber(d.student_count)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </DataState>
        </Card>

        <Card
          accent="amber"
          icon="bi-arrow-left-right"
          title="Recent Transfers"
          subtitle="Latest requests involving your region"
          actions={<Button variant="ghost" size="sm" to={`/regional/${regionId}/transfers`}>View all</Button>}
        >
          <DataState
            loading={transfers.loading}
            error={transfers.error}
            onRetry={transfers.reload}
            empty={recentTransfers.length === 0}
            emptyMessage="No transfers involving this region yet."
          >
            <ul className="ui-list">
              {recentTransfers.map((t) => (
                <li key={t.id} className="ui-list-item">
                  <div className="ui-list-main">
                    <div className="ui-list-title">{t.student_name}</div>
                    <div className="ui-list-sub">
                      {t.from_school_name} → {t.to_school_name} · {formatDate(t.date_initiated)}
                    </div>
                  </div>
                  <TransferStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </DataState>
        </Card>
      </div>
    </Page>
  );
}
