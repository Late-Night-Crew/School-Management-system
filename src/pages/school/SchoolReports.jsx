import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

import { listAcademicYears } from "../../api/academicYears";
import { listSchoolExamResults, listSchoolMarks, listAllSchoolStudents } from "../../api/schoolPortal";
import { listSubjects } from "../../api/subjects";
import { schoolPromotionBase } from "../../api/promotion";
import { listTermReports } from "../../api/termReports";
import { startedYears } from "../../utils/years";
import TermReports from "./TermReports";
import useAsync from "../../hooks/useAsync";
import { formatRate, fullName } from "../../utils/format";
import { average, formatMark, gradeFor, isPass, passRate, useGradingScale } from "../../utils/grades";
import DataState from "../../components/DataState";
import GradeBadge from "../../components/GradeBadge";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, Field, IconButton, Input, Page, Person, Select, Table } from "../../components/ui";
import styles from "./SchoolReports.module.css";

const FORMS = [1, 2, 3, 4];


// Cumulative marks report: each student's average per subject over the chosen
// year(s) and term(s), their overall average, grade and position in the selection.
function MarksReport({ schoolId, students, subjects, years }) {
  const scale = useGradingScale();
  const sortedYears = startedYears(years).sort((a, b) => b.year - a.year);
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
        passed: recorded.filter((v) => isPass(v, scale)).length,
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
      passRate: passRate(values, scale),
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
    gradeFor(r.overall, scale).grade,
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
        subtitle={`Subject marks averaged over the selection · Pass mark ${scale ? scale.passMark : "-"} · Current students only`}
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

// The school's JCE/MSCE pass rates by year. They are calculated from Term 3 results
// (Form 2's are the JCE, Form 4's the MSCE) when the year's Term 3 closes; rates
// typed in before term reports existed are still listed.
function ExamPassRates({ schoolId, years }) {
  const data = useAsync(
    useCallback(
      () => Promise.all([listTermReports(schoolPromotionBase(false, schoolId)), listSchoolExamResults(schoolId)]),
      [schoolId]
    )
  );
  const [reports = [], recorded = []] = data.data || [];
  const yearOf = (id) => years.find((y) => y.id === id)?.year || `Year #${id}`;
  const term3 = reports.filter((r) => r.term === 3);
  const calculatedYears = new Set(term3.map((r) => r.academic_year_id));
  const rows = [
    ...term3.map((r) => ({ id: `t-${r.academic_year_id}`, year: r.year, jce: r.jce_pass_rate, msce: r.msce_pass_rate, source: r.live ? "live" : "calculated", outOfDate: r.out_of_date })),
    ...recorded
      .filter((r) => !calculatedYears.has(r.academic_year_id))
      .map((r) => ({ id: `r-${r.id}`, year: yearOf(r.academic_year_id), jce: r.jce_pass_rate, msce: r.msce_pass_rate, source: "recorded" })),
  ].sort((a, b) => Number(b.year) - Number(a.year));

  const sourceBadge = {
    calculated: <Badge tone="green">From Term 3 results</Badge>,
    live: <Badge tone="blue">Term 3 in progress</Badge>,
    recorded: <Badge tone="slate">Recorded by hand</Badge>,
  };

  return (
    <Card
      accent="green"
      icon="bi-award"
      title="JCE and MSCE pass rates"
      subtitle="Worked out from Term 3 results, using MANEB's pass rule (see Promotion settings); nothing to type in"
      flush
    >
      <DataState loading={data.loading} error={data.error} onRetry={data.reload} empty={!rows.length} emptyMessage="No exam results yet.">
        <Table>
          <thead>
            <tr>
              <th>Academic Year</th>
              <th className="num">JCE (Form 2)</th>
              <th className="num">MSCE (Form 4)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="strong">{r.year}</td>
                <td className="num">{formatRate(r.jce)}</td>
                <td className="num">{formatRate(r.msce)}</td>
                <td>
                  {sourceBadge[r.source]}
                  {r.outOfDate && (
                    <span className="ms-2">
                      <Badge tone="amber">Marks changed: regenerate on Term Reports</Badge>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataState>
    </Card>
  );
}

export default function SchoolReports() {
  const { schoolId } = useParams();
  const [tab, setTab] = useState("marks");
  const lookups = useAsync(
    useCallback(() => Promise.all([listAllSchoolStudents(schoolId), listSubjects(), listAcademicYears()]), [schoolId])
  );
  const [students, subjects, years] = lookups.data || [];

  return (
    <Page
      icon="bi-bar-chart-line-fill"
      title="Reports"
      subtitle="Student marks, end-of-term reports and national exam pass rates for your school."
      tabs={[
        { key: "marks", label: "Student Marks", icon: "bi-table" },
        { key: "terms", label: "Term Reports", icon: "bi-clipboard-data" },
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
            <div className={styles.pane} hidden={tab !== "terms"}>
              <TermReports base={schoolPromotionBase(false, schoolId)} />
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
