import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

import { listAcademicYears } from "../../api/academicYears";
import {
  createSchoolExamResult,
  listSchoolExamResults,
  listSchoolMarks,
  listSchoolStudents,
  updateSchoolExamResult,
} from "../../api/schoolPortal";
import { listSubjects } from "../../api/subjects";
import useAsync from "../../hooks/useAsync";
import { formatRate, fullName } from "../../utils/format";
import { PASS_MARK, average, formatMark, gradeFor } from "../../utils/grades";
import DataState from "../../components/DataState";
import GradeBadge from "../../components/GradeBadge";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, Field, IconButton, Input, Page, Person, Select, Table } from "../../components/ui";
import styles from "./SchoolReports.module.css";

const FORMS = [1, 2, 3, 4];


// Cumulative marks report: each student's average per subject over the chosen
// year(s) and term(s), their overall average, grade and position in the selection.
function MarksReport({ schoolId, students, subjects, years }) {
  const sortedYears = [...years].sort((a, b) => b.year - a.year);
  const defaultYear = sortedYears.find((y) => y.status === "Active") || sortedYears[0];
  const [filters, setFilters] = useState({
    academic_year_id: defaultYear ? String(defaultYear.id) : "",
    term: "",
    form: "",
  });
  const setFilter = (name) => (e) => setFilters((prev) => ({ ...prev, [name]: e.target.value }));

  const marks = useAsync(
    useCallback(
      () => listSchoolMarks(schoolId, { academic_year_id: filters.academic_year_id, term: filters.term }),
      [schoolId, filters.academic_year_id, filters.term]
    )
  );

  // student id -> subject id -> marks in the selection
  const byStudent = {};
  (marks.data || []).forEach((m) => {
    byStudent[m.student_id] ??= {};
    (byStudent[m.student_id][m.subject_id] ??= []).push(m.mark);
  });

  const selectedStudents = students.filter((s) => !filters.form || s.form_level === Number(filters.form));
  const markedSubjectIds = new Set(selectedStudents.flatMap((s) => Object.keys(byStudent[s.id] || {}).map(Number)));
  const columns = subjects.filter((sub) => markedSubjectIds.has(sub.id));

  const rows = selectedStudents
    .map((student) => {
      const subjectAverages = Object.fromEntries(
        columns.map((sub) => [sub.id, average(byStudent[student.id]?.[sub.id] || [])])
      );
      const recorded = Object.values(subjectAverages).filter((v) => v != null);
      return {
        student,
        subjectAverages,
        overall: average(recorded),
        passed: recorded.filter((v) => v >= PASS_MARK).length,
        taken: recorded.length,
      };
    })
    .filter((row) => row.taken > 0)
    .sort((a, b) => b.overall - a.overall);
  // Equal averages share a position (1, 2, 2, 4, ...)
  rows.forEach((row, i) => {
    row.position = i > 0 && row.overall === rows[i - 1].overall ? rows[i - 1].position : i + 1;
  });

  const subjectSummaries = columns.map((sub) => {
    const values = rows.map((r) => r.subjectAverages[sub.id]).filter((v) => v != null);
    return {
      ...sub,
      average: average(values),
      passRate: values.length ? (values.filter((v) => v >= PASS_MARK).length / values.length) * 100 : null,
      count: values.length,
    };
  });

  const yearLabel = years.find((y) => String(y.id) === filters.academic_year_id)?.year || "All years";
  const title = [
    "Marks Report",
    yearLabel,
    filters.term ? `Term ${filters.term}` : "All terms",
    filters.form ? `Form ${filters.form}` : "All forms",
  ].join(" · ");

  const tableHead = ["Position", "Student", "Student Number", "Form", ...columns.map((c) => c.name), "Average", "Grade", "Passed"];
  const tableBody = rows.map((r) => [
    r.position,
    fullName(r.student),
    r.student.student_number,
    r.student.form_level,
    ...columns.map((c) => formatMark(r.subjectAverages[c.id])),
    formatMark(r.overall),
    gradeFor(r.overall).grade,
    `${r.passed}/${r.taken}`,
  ]);

  const exportXLS = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([tableHead, ...tableBody]), "Marks");
    XLSX.writeFile(workbook, `marks_report_${yearLabel}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(title, 14, 12);
    autoTable(doc, { startY: 18, styles: { fontSize: 8 }, head: [tableHead], body: tableBody });
    doc.save(`marks_report_${yearLabel}.pdf`);
  };

  return (
    <>
      <Card accent="blue" icon="bi-funnel" title="Selection" subtitle="Leave year or term empty to combine them">
        <div className="ui-grid ui-cols-3">
          <Field label="Academic Year">
            <Select value={filters.academic_year_id} onChange={setFilter("academic_year_id")}>
              <option value="">All years (cumulative)</option>
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                  {y.status === "Active" ? " (active)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Term">
            <Select value={filters.term} onChange={setFilter("term")}>
              <option value="">All terms (cumulative)</option>
              {[1, 2, 3].map((t) => (
                <option key={t} value={t}>Term {t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Form">
            <Select value={filters.form} onChange={setFilter("form")}>
              <option value="">All forms</option>
              {FORMS.map((f) => (
                <option key={f} value={f}>Form {f}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card
        accent="green"
        icon="bi-trophy"
        title={title}
        subtitle={`Subject marks averaged over the selection · Pass mark ${PASS_MARK} · Current students only`}
        actions={
          <>
            <Button variant="success" size="sm" icon="bi-file-earmark-excel" onClick={exportXLS} disabled={!rows.length}>
              Export XLS
            </Button>
            <Button variant="danger" size="sm" icon="bi-file-earmark-pdf" onClick={exportPDF} disabled={!rows.length}>
              Export PDF
            </Button>
          </>
        }
        flush
      >
        <DataState
          loading={marks.loading}
          error={marks.error}
          onRetry={marks.reload}
          empty={rows.length === 0}
          emptyMessage="No marks have been recorded for this selection yet."
        >
          <Table nowrap>
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Form</th>
                {columns.map((c) => (
                  <th key={c.id} className="num">{c.name}</th>
                ))}
                <th className="num">Average</th>
                <th className="center">Grade</th>
                <th className="num">Passed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                return (
                  <tr key={r.student.id}>
                    <td className="strong">{r.position}</td>
                    <td>
                      <Person name={fullName(r.student)} sub={r.student.student_number} />
                    </td>
                    <td>{r.student.form_level}</td>
                    {columns.map((c) => (
                      <td key={c.id} className="num">{formatMark(r.subjectAverages[c.id])}</td>
                    ))}
                    <td className="num strong">{formatMark(r.overall)}</td>
                    <td className="center">
                      <GradeBadge mark={r.overall} />
                    </td>
                    <td className="num">{r.passed}/{r.taken}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </DataState>
      </Card>

      {subjectSummaries.length > 0 && (
        <Card accent="purple" icon="bi-clipboard-data" title="Subject Summary" subtitle="Average and pass rate per subject" flush>
          <Table compact>
            <thead>
              <tr>
                <th>Subject</th>
                <th className="num">Students</th>
                <th className="num">Average</th>
                <th className="num">Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {subjectSummaries.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td className="num">{s.count}</td>
                  <td className="num">{formatMark(s.average)}</td>
                  <td className="num">{s.passRate == null ? "-" : `${s.passRate.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}

// The school's JCE/MSCE pass rates per academic year (one result per year).
// These feed the national and regional school reports.
function ExamPassRates({ schoolId, years }) {
  const results = useAsync(useCallback(() => listSchoolExamResults(schoolId), [schoolId]));
  const sortedYears = [...years].sort((a, b) => b.year - a.year);
  const [form, setForm] = useState({ academic_year_id: "", jce_pass_rate: "", msce_pass_rate: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  const existing = (results.data || []).find((r) => String(r.academic_year_id) === form.academic_year_id);

  // Picking a year loads that year's recorded rates into the form
  const selectYear = (yearId) => {
    const result = (results.data || []).find((r) => String(r.academic_year_id) === yearId);
    setForm({
      academic_year_id: yearId,
      jce_pass_rate: result?.jce_pass_rate || "",
      msce_pass_rate: result?.msce_pass_rate || "",
    });
  };

  const validRate = (value) => value === "" || (Number(value) >= 0 && Number(value) <= 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validRate(form.jce_pass_rate) || !validRate(form.msce_pass_rate)) {
      setToast({ show: true, message: "Pass rates must be between 0 and 100.", variant: "warning" });
      return;
    }
    setSaving(true);
    try {
      const rates = { jce_pass_rate: String(form.jce_pass_rate), msce_pass_rate: String(form.msce_pass_rate) };
      if (existing) {
        await updateSchoolExamResult(schoolId, existing.id, rates);
      } else {
        await createSchoolExamResult(schoolId, { academic_year_id: Number(form.academic_year_id), ...rates });
      }
      setToast({ show: true, message: "Pass rates saved.", variant: "success" });
      results.reload();
    } catch (err) {
      setToast({ show: true, message: err.message, variant: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const yearOf = (id) => years.find((y) => y.id === id);

  return (
    <>
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <div className="ui-grid ui-cols-2">
        <form onSubmit={handleSubmit}>
          <Card
            accent="blue"
            icon="bi-pencil-square"
            title="Record Pass Rates"
            subtitle="Pick a year to enter or update its JCE and MSCE pass rates"
            footer={
              <Button type="submit" icon="bi-check-lg" disabled={!form.academic_year_id || saving}>
                {saving ? "Saving…" : existing ? "Update pass rates" : "Save pass rates"}
              </Button>
            }
          >
            <div className="ui-grid">
              <Field label="Academic Year" required>
                <Select value={form.academic_year_id} onChange={(e) => selectYear(e.target.value)} required>
                  <option value="">Select a year…</option>
                  {sortedYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.year}</option>
                  ))}
                </Select>
              </Field>
              <div className="ui-grid ui-cols-2">
                <Field label="JCE pass rate (%)">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={form.jce_pass_rate}
                    onChange={(e) => setForm((f) => ({ ...f, jce_pass_rate: e.target.value }))}
                  />
                </Field>
                <Field label="MSCE pass rate (%)">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={form.msce_pass_rate}
                    onChange={(e) => setForm((f) => ({ ...f, msce_pass_rate: e.target.value }))}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </form>

        <Card accent="green" icon="bi-award" title="Recorded Pass Rates" subtitle="One result per academic year" flush>
          <DataState
            loading={results.loading}
            error={results.error}
            onRetry={results.reload}
            empty={!results.data?.length}
            emptyMessage="No pass rates recorded yet."
          >
            <Table>
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th className="num">JCE</th>
                  <th className="num">MSCE</th>
                  <th className="end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...(results.data || [])]
                  .sort((a, b) => (yearOf(b.academic_year_id)?.year || 0) - (yearOf(a.academic_year_id)?.year || 0))
                  .map((r) => {
                    const year = yearOf(r.academic_year_id)?.year || `Year #${r.academic_year_id}`;
                    return (
                      <tr key={r.id}>
                        <td className="strong">{year}</td>
                        <td className="num">{formatRate(r.jce_pass_rate)}</td>
                        <td className="num">{formatRate(r.msce_pass_rate)}</td>
                        <td className="end">
                          <IconButton kind="edit" title={`Edit ${year} pass rates`} onClick={() => selectYear(String(r.academic_year_id))} />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          </DataState>
        </Card>
      </div>
    </>
  );
}

export default function SchoolReports() {
  const { schoolId } = useParams();
  const [tab, setTab] = useState("marks");
  const lookups = useAsync(
    useCallback(() => Promise.all([listSchoolStudents(schoolId), listSubjects(), listAcademicYears()]), [schoolId])
  );
  const [students, subjects, years] = lookups.data || [];

  return (
    <Page
      icon="bi-bar-chart-line-fill"
      title="Reports"
      subtitle="Student marks and national exam pass rates for your school."
      tabs={[
        { key: "marks", label: "Student Marks", icon: "bi-table" },
        { key: "exams", label: "Exam Pass Rates", icon: "bi-award" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      <DataState loading={lookups.loading} error={lookups.error} onRetry={lookups.reload}>
        {lookups.data && (
          <>
            <div className={styles.pane} hidden={tab !== "marks"}>
              <MarksReport schoolId={schoolId} students={students} subjects={subjects} years={years} />
            </div>
            <div className={styles.pane} hidden={tab !== "exams"}>
              <ExamPassRates schoolId={schoolId} years={years} />
            </div>
          </>
        )}
      </DataState>
    </Page>
  );
}
