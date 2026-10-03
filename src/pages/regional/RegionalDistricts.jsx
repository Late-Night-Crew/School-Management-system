import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { listRegionDistricts } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import { formatNumber } from "../../utils/format";
import DataState from "../../components/DataState";
import { Button, Card, Page, Table } from "../../components/ui";

export default function RegionalDistricts() {
  const { regionId } = useParams();
  const { data: districts = [], loading, error, reload } = useAsync(
    useCallback(() => listRegionDistricts(regionId), [regionId])
  );
  const totalSchools = districts.reduce((sum, d) => sum + d.school_count, 0);

  return (
    <Page
      icon="bi-geo-alt-fill"
      title="Districts"
      subtitle="Districts in your region. Districts and schools are set up by the system administrator."
      stats={[
        { label: "Districts", value: loading ? null : districts.length },
        { label: "Schools", value: loading ? null : formatNumber(totalSchools) },
      ]}
    >
      <Card accent="blue" icon="bi-list-ul" title="All Districts" subtitle="School and student counts per district" flush>
        <DataState loading={loading} error={error} onRetry={reload} empty={districts.length === 0} emptyMessage="No districts in this region yet.">
          <Table>
            <thead>
              <tr>
                <th>District</th>
                <th className="num">Schools</th>
                <th className="num">Students</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.id}>
                  <td className="strong">{d.name}</td>
                  <td className="num">{formatNumber(d.school_count)}</td>
                  <td className="num">{formatNumber(d.student_count)}</td>
                  <td className="end">
                    <Button variant="ghost" size="sm" icon="bi-building" to={`/regional/${regionId}/schools?district=${d.id}`}>
                      Schools
                    </Button>{" "}
                    <Button variant="ghost" size="sm" icon="bi-people" to={`/regional/${regionId}/students?district=${d.id}`}>
                      Students
                    </Button>
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
