import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { listRegionDistricts, listRegionSchools, listRegionStudents } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { formatNumber, fullName } from "../../utils/format";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import { Badge, Button, Card, Field, Page, Person, SearchInput, Select, Table } from "../../components/ui";

const STATUS_TONES = { active: "green", graduated: "blue", transferred: "amber" };

export default function RegionalStudents() {
  const { regionId } = useParams();
  // District and school filters live in the URL so other pages can link to them
  const [searchParams, setSearchParams] = useSearchParams();
  const districtId = searchParams.get("district") || "";
  const schoolId = searchParams.get("school") || "";
  const [search, setSearch] = useState("");

  const districts = useAsync(useCallback(() => listRegionDistricts(regionId), [regionId]));
  const schools = useAsync(useCallback(() => listRegionSchools(regionId), [regionId]));
  const students = useAsync(
    useCallback(
      () => listRegionStudents(regionId, { district_id: districtId, school_id: schoolId }),
      [regionId, districtId, schoolId]
    )
  );

  const schoolOptions = (schools.data || []).filter((s) => !districtId || s.district_id === Number(districtId));

  const all = students.data || [];
  const term = search.trim().toLowerCase();
  const visibleStudents = all.filter(
    (s) => fullName(s).toLowerCase().includes(term) || s.student_number.toLowerCase().includes(term)
  );
  const { page, pageCount, pageItems, setPage } = usePagination(visibleStudents, 25);

  const setFilter = (name, value) => {
    const next = { district: districtId, school: schoolId, [name]: value };
    // A school only makes sense within the chosen district
    if (name === "district") next.school = "";
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  const exportXLS = () => {
    const rows = visibleStudents.map((s) => ({
      "Student Number": s.student_number,
      Name: fullName(s),
      Gender: s.gender,
      Form: s.form_level || "",
      School: s.school_name,
      District: s.district_name,
      Status: s.status,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Students");
    XLSX.writeFile(workbook, "region_students.xlsx");
  };

  return (
    <Page
      icon="bi-people-fill"
      title="Students"
      subtitle="Students enrolled at schools in your region."
      stats={[{ label: "Students", value: students.loading ? null : formatNumber(all.length) }]}
      actions={
        <Button variant="ghost" icon="bi-file-earmark-excel" onClick={exportXLS} disabled={!visibleStudents.length}>
          Export XLS
        </Button>
      }
    >
      <Card accent="slate" icon="bi-funnel" title="Filters">
        <div className="ui-grid ui-cols-3">
          <Field label="District">
            <Select value={districtId} onChange={(e) => setFilter("district", e.target.value)}>
              <option value="">All districts</option>
              {districts.data?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="School">
            <Select value={schoolId} onChange={(e) => setFilter("school", e.target.value)}>
              <option value="">All schools</option>
              {schoolOptions.map((s) => (
                <option key={s.school_id} value={s.school_id}>{s.school_name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="Name or student number" />
          </Field>
        </div>
      </Card>

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Students"
        subtitle={students.loading ? null : `${formatNumber(visibleStudents.length)} students`}
        flush
      >
        <DataState
          loading={students.loading}
          error={students.error}
          onRetry={students.reload}
          empty={visibleStudents.length === 0}
          emptyMessage="No students match these filters."
        >
          <Table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Gender</th>
                <th>Form</th>
                <th>School</th>
                <th>District</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s) => (
                <tr key={s.id}>
                  <td><Person name={fullName(s)} sub={s.student_number} /></td>
                  <td>{s.gender || "-"}</td>
                  <td>{s.form_level || "-"}</td>
                  <td>{s.school_name}</td>
                  <td>{s.district_name}</td>
                  <td>
                    {s.status ? <Badge tone={STATUS_TONES[s.status.toLowerCase()] || "slate"}>{s.status}</Badge> : "-"}
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
