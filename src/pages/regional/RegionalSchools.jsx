import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { listRegionDistricts, listRegionSchools } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import { formatNumber } from "../../utils/format";
import DataState from "../../components/DataState";
import { Button, Card, Field, Page, SearchInput, Select, Table } from "../../components/ui";

export default function RegionalSchools() {
  const { regionId } = useParams();
  // The district filter lives in the URL so other pages can link to it
  const [searchParams, setSearchParams] = useSearchParams();
  const districtId = searchParams.get("district") || "";
  const [search, setSearch] = useState("");

  const districts = useAsync(useCallback(() => listRegionDistricts(regionId), [regionId]));
  const schools = useAsync(
    useCallback(() => listRegionSchools(regionId, { district_id: districtId }), [regionId, districtId])
  );

  const all = schools.data || [];
  const term = search.trim().toLowerCase();
  const visibleSchools = all.filter(
    (s) => s.school_name.toLowerCase().includes(term) || s.school_number.toLowerCase().includes(term)
  );
  const totalStudents = all.reduce((sum, s) => sum + s.student_count, 0);

  const setDistrict = (value) => setSearchParams(value ? { district: value } : {});

  return (
    <Page
      icon="bi-building"
      title="Schools"
      subtitle="Enrolment and transfer figures for each school in your region."
      stats={[
        { label: "Schools", value: schools.loading ? null : all.length },
        { label: "Students", value: schools.loading ? null : formatNumber(totalStudents) },
      ]}
    >
      <Card accent="slate" icon="bi-funnel" title="Filters">
        <div className="ui-grid ui-cols-2">
          <Field label="District">
            <Select value={districtId} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">All districts</option>
              {districts.data?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="School name or number" />
          </Field>
        </div>
      </Card>

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Schools"
        subtitle={schools.loading ? null : `${visibleSchools.length} of ${all.length} shown`}
        flush
      >
        <DataState
          loading={schools.loading}
          error={schools.error}
          onRetry={schools.reload}
          empty={visibleSchools.length === 0}
          emptyMessage="No schools match these filters."
        >
          <Table>
            <thead>
              <tr>
                <th>School</th>
                <th>District</th>
                <th className="num">Students</th>
                <th className="num">Male / Female</th>
                <th className="num">Transfers In / Out</th>
                <th className="num">Pending In</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSchools.map((s) => (
                <tr key={s.school_id}>
                  <td>
                    <div className="ui-list-title">{s.school_name}</div>
                    <div className="ui-list-sub">{s.school_number}</div>
                  </td>
                  <td>{s.district_name}</td>
                  <td className="num">{formatNumber(s.student_count)}</td>
                  <td className="num">{s.male_count} / {s.female_count}</td>
                  <td className="num">{s.transfers_in} / {s.transfers_out}</td>
                  <td className="num">{s.pending_in}</td>
                  <td className="end">
                    <Button variant="ghost" size="sm" icon="bi-people" to={`/regional/${regionId}/students?school=${s.school_id}`}>
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
