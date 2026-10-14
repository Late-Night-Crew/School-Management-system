import { startedYears } from "../utils/years";
import { useCallback, useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";

import useAsync from "../hooks/useAsync";
import { formatRate } from "../utils/format";
import DataState from "./DataState";
import { Button, Card, Field, Select, StatTile, Table } from "./ui";

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const average = (values) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null);

// Columns shared by the table and the XLS/PDF exports
const COLUMNS = [
  { header: "School", value: (r) => `${r.school_name} (${r.school_number})` },
  { header: "District", value: (r) => r.district_name },
  { header: "Region", value: (r) => r.region_name },
  { header: "Students", value: (r) => r.student_count, numeric: true },
  { header: "Male", value: (r) => r.male_count, numeric: true },
  { header: "Female", value: (r) => r.female_count, numeric: true },
  { header: "With Disability", value: (r) => r.disability_count, numeric: true },
  { header: "Transfers In", value: (r) => r.transfers_in, numeric: true },
  { header: "Transfers Out", value: (r) => r.transfers_out, numeric: true },
  { header: "Pending In", value: (r) => r.pending_in, numeric: true },
  { header: "JCE Pass Rate", value: (r) => formatRate(r.jce_pass_rate), numeric: true },
  { header: "MSCE Pass Rate", value: (r) => formatRate(r.msce_pass_rate), numeric: true },
  // Calculated from Term 3 results, or recorded by hand before term reports existed
  { header: "Exam rates", value: (r) => ({ calculated: "From Term 3", recorded: "Recorded" })[r.pass_rate_source] || "-" },
];

const COUNT_KEYS = ["student_count", "male_count", "female_count", "disability_count", "transfers_in", "transfers_out", "pending_in"];

// Per-school summary report with filters, summary cards and XLS/PDF/print export.
//
// - loadReport(filters): memoized; resolves to report rows for
//   { region_id, district_id, academic_year_id }
// - regions: shows the region filter when given (national reports only)
// - districts: [{ id, name, region_id? }]
// - academicYears: pass rates default to the active year, else the latest
// - scopeName: describes the unfiltered scope, e.g. "All regions"
export default function SchoolReport({ loadReport, regions, districts, academicYears, scopeName }) {
  const years = startedYears(academicYears).sort((a, b) => b.year - a.year);
  const [filters, setFilters] = useState(() => {
    const defaultYear = years.find((y) => y.status === "Active") || years[0];
    return { region_id: "", district_id: "", academic_year_id: defaultYear ? String(defaultYear.id) : "" };
  });

  const { data: rows = [], loading, error, reload } = useAsync(
    useCallback(() => loadReport(filters), [loadReport, filters])
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // A district only makes sense within the chosen region
      ...(name === "region_id" ? { district_id: "" } : {}),
    }));
  };

  const visibleDistricts = filters.region_id
    ? districts.filter((d) => d.region_id === Number(filters.region_id))
    : districts;

  const selectedYear = years.find((y) => y.id === Number(filters.academic_year_id));
  const scopeLabel =
    [
      regions?.find((r) => r.id === Number(filters.region_id))?.name,
      districts.find((d) => d.id === Number(filters.district_id))?.name,
    ]
      .filter(Boolean)
      .join(" / ") || scopeName;
  const reportTitle = `School Summary Report: ${scopeLabel}${selectedYear ? `, pass rates ${selectedYear.year}` : ""}`;

  const totals = Object.fromEntries(COUNT_KEYS.map((key) => [key, rows.reduce((sum, r) => sum + (r[key] || 0), 0)]));
  const jceRates = rows.map((r) => r.jce_pass_rate).filter((v) => v != null);
  const msceRates = rows.map((r) => r.msce_pass_rate).filter((v) => v != null);
  const reportingSchools = rows.filter((r) => r.jce_pass_rate != null || r.msce_pass_rate != null).length;

  const summaryCards = [
    { label: "Schools", value: rows.length, detail: scopeLabel, icon: "bi-building", tone: "blue" },
    {
      label: "Students",
      icon: "bi-people-fill",
      tone: "green",
      value: totals.student_count.toLocaleString(),
      detail: `${totals.male_count} male · ${totals.female_count} female · ${totals.disability_count} with disability`,
    },
    {
      label: "Incoming Transfers",
      value: totals.transfers_in.toLocaleString(),
      detail: `${totals.pending_in} awaiting approval`,
      icon: "bi-arrow-left-right",
      tone: "amber",
    },
    {
      label: "Average JCE / MSCE pass rate",
      icon: "bi-mortarboard",
      tone: "purple",
      // "66.7 / 72.1%": one % sign so both figures fit the tile
      value: `${formatRate(average(jceRates)).replace("%", "")} / ${formatRate(average(msceRates))}`,
      detail: selectedYear
        ? `${reportingSchools} of ${rows.length} schools reported for ${selectedYear.year}`
        : "No academic year selected",
    },
  ];

  const fileName = `school_report_${selectedYear?.year || "all"}`;

  const exportXLS = () => {
    const sheetRows = rows.map((r) => Object.fromEntries(COLUMNS.map((c) => [c.header, c.value(r)])));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheetRows), "Schools");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(reportTitle, 14, 12);
    autoTable(doc, {
      startY: 18,
      styles: { fontSize: 8 },
      head: [["#", ...COLUMNS.map((c) => c.header)]],
      body: rows.map((r, i) => [i + 1, ...COLUMNS.map((c) => c.value(r))]),
    });
    doc.save(`${fileName}.pdf`);
  };

  const printTable = () => {
    const printContent = document.getElementById("schoolReportTable").outerHTML;
    const newWin = window.open("");
    newWin.document.write("<html><head><title>Print Report</title>");
    newWin.document.write(
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"><style>table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ddd;padding:6px}</style>`
    );
    newWin.document.write("</head><body>");
    // Division and district names are typed by users, so the title is escaped (the table
    // is React's own escaped markup)
    newWin.document.write(`<h3 class='text-center my-3'>${escapeHtml(reportTitle)}</h3>`);
    newWin.document.write(printContent);
    newWin.document.write("</body></html>");
    newWin.document.close();
    newWin.print();
  };

  return (
    <>
      <Card accent="slate" icon="bi-funnel" title="Filters" subtitle="Narrow the report by area and choose the pass-rate year">
        <div className={`ui-grid ${regions ? "ui-cols-3" : "ui-cols-2"}`}>
          {regions && (
            <Field label="Division">
              <Select name="region_id" value={filters.region_id} onChange={handleChange}>
                <option value="">All divisions</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="District">
            <Select name="district_id" value={filters.district_id} onChange={handleChange}>
              <option value="">All districts</option>
              {visibleDistricts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pass rates for academic year">
            <Select name="academic_year_id" value={filters.academic_year_id} onChange={handleChange}>
              <option value="">None</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                  {y.status === "Active" ? " (active)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <div className="ui-grid ui-cols-4">
        {summaryCards.map((card) => (
          <StatTile key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <Card
        accent="blue"
        icon="bi-table"
        title="Schools"
        subtitle={reportTitle}
        flush
        actions={
          <>
            <Button variant="success" size="sm" icon="bi-file-earmark-excel" onClick={exportXLS} disabled={!rows.length}>
              Excel
            </Button>
            <Button variant="danger" size="sm" icon="bi-file-earmark-pdf" onClick={exportPDF} disabled={!rows.length}>
              PDF
            </Button>
            <Button variant="ghost" size="sm" icon="bi-printer" onClick={printTable} disabled={!rows.length}>
              Print
            </Button>
          </>
        }
      >
        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={rows.length === 0}
          emptyMessage="No schools match these filters."
        >
          <Table id="schoolReportTable">
            <thead>
              <tr>
                <th>#</th>
                {COLUMNS.map((c) => (
                  <th key={c.header} className={c.numeric ? "num" : ""}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={r.school_id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="ui-cell-title">{r.school_name}</div>
                    <div className="ui-cell-sub">{r.school_number}</div>
                  </td>
                  {COLUMNS.slice(1).map((c) => (
                    <td key={c.header} className={c.numeric ? "num" : "nowrap"}>{c.value(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total ({rows.length} schools; pass rates averaged)</td>
                {COUNT_KEYS.map((key) => (
                  <td key={key} className="num">{totals[key]}</td>
                ))}
                <td className="num">{formatRate(average(jceRates))}</td>
                <td className="num">{formatRate(average(msceRates))}</td>
              </tr>
            </tfoot>
          </Table>
        </DataState>
      </Card>
    </>
  );
}
