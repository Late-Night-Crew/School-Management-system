import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { listRegionDistricts, listRegionSchools, listRegionStudents } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import useServerPage, { fetchAllPages } from "../../hooks/useServerPage";
import { formatNumber, fullName } from "../../utils/format";
import { FORMS, LEARNER_SHOWS, learnerSheetRows } from "../../utils/learners";
import DataState from "../../components/DataState";
import { LearnerStatusBadge } from "../../components/LearnerStatus";
import TablePagination from "../../components/TablePagination";
import { Button, Card, Field, Notice, Page, Person, SearchInput, Segmented, Select, Table } from "../../components/ui";

export default function RegionalStudents() {
  const { regionId } = useParams();
  // District and school filters live in the URL so other pages can link to them
  const [searchParams, setSearchParams] = useSearchParams();
  const districtId = searchParams.get("district") || "";
  const schoolId = searchParams.get("school") || "";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Active");
  const [form, setForm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const districts = useAsync(useCallback(() => listRegionDistricts(regionId), [regionId]));
  const schools = useAsync(useCallback(() => listRegionSchools(regionId), [regionId]));
  const fetchPage = useCallback((filters) => listRegionStudents(regionId, filters), [regionId]);
  const list = useServerPage(fetchPage, { district_id: districtId, school_id: schoolId, status, form_level: form }, search);

  const schoolOptions = (schools.data || []).filter((s) => !districtId || s.district_id === Number(districtId));

  const setFilter = (name, value) => {
    const next = { district: districtId, school: schoolId, [name]: value };
    // A school only makes sense within the chosen district
    if (name === "district") next.school = "";
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  const exportXLS = async () => {
    setExporting(true);
    setExportError("");
    try {
      const rows = learnerSheetRows(await fetchAllPages(fetchPage, list.query), false);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Students");
      XLSX.writeFile(workbook, "division_students.xlsx");
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Page
      icon="bi-people-fill"
      title="Students"
      subtitle="Learners at the schools in your division."
      actions={
        <Button variant="ghost" icon="bi-file-earmark-excel" onClick={exportXLS} disabled={!list.total || exporting}>
          {exporting ? "Preparing…" : "Export XLS"}
        </Button>
      }
    >
      <Card accent="slate" icon="bi-funnel" title="Filters">
        <div className="ui-grid ui-cols-4">
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
          <Field label="Form">
            <Select value={form} onChange={(e) => setForm(e.target.value)}>
              <option value="">All forms</option>
              {FORMS.map((f) => (
                <option key={f} value={f}>Form {f}</option>
              ))}
            </Select>
          </Field>
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="Name, number or National ID" />
          </Field>
        </div>
      </Card>

      {exportError && <Notice tone="red">{exportError}</Notice>}

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="Students"
        subtitle={list.firstLoad ? null : `${formatNumber(list.total)} ${list.total === 1 ? "learner" : "learners"}`}
        actions={<Segmented options={LEARNER_SHOWS} value={status} onChange={setStatus} />}
        flush
      >
        <DataState
          loading={list.firstLoad}
          error={list.error}
          onRetry={list.reload}
          empty={!list.items.length}
          emptyMessage="No students match these filters."
        >
          <div style={{ opacity: list.refreshing ? 0.55 : 1, transition: "opacity 0.15s" }}>
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
                {list.items.map((s) => (
                  <tr key={s.id}>
                    <td><Person name={fullName(s)} sub={s.student_number} /></td>
                    <td>{s.gender || "-"}</td>
                    <td>{s.form_level || "-"}</td>
                    <td>{s.school_name}</td>
                    <td>{s.district_name}</td>
                    <td><LearnerStatusBadge student={s} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <TablePagination page={list.page} pageCount={list.pageCount} onChange={list.setPage} />
          </div>
        </DataState>
      </Card>
    </Page>
  );
}
