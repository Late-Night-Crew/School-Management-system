import React, { useState } from "react";
import ToastNote from "../../components/ToastNote";

// ─── SCHOOL META ──────────────────────────────────────────────────────────────
const SCHOOL_META = {
    systemName:  "Open Day System",
    systemLogo:  null,
    schoolName:  "Zingwangwa Secondary School",
    managerName: "Mr. Gift Kungala",
    address:     "P.O. Box 123, Blantyre, Malawi",
    region:      "Southern Region",
    schoolCode:  "MNS-0042",
};

// ─── ACADEMIC YEARS ───────────────────────────────────────────────────────────
const ACADEMIC_YEARS = [
    { value: "2025", label: "2024 - 2025" },
    { value: "2024", label: "2023 - 2024" },
    { value: "2023", label: "2022 - 2023" },
    { value: "2022", label: "2021 - 2022" },
    { value: "2021", label: "2020 - 2021" },
];

// ─── CLASS / SCOPE OPTIONS ────────────────────────────────────────────────────
const CLASS_OPTIONS = [
    { value: "whole", label: "Whole School",    forms: [1, 2, 3, 4], icon: "bi-building"        },
    { value: "1",     label: "Form 1",          forms: [1],          icon: "bi-1-circle-fill"    },
    { value: "2",     label: "Form 2 (JCE)",    forms: [2],          icon: "bi-mortarboard-fill" },
    { value: "3",     label: "Form 3",          forms: [3],          icon: "bi-3-circle-fill"    },
    { value: "4",     label: "Form 4 (MSCE)",   forms: [4],          icon: "bi-award-fill"       },
];

// ─── SUBJECTS ─────────────────────────────────────────────────────────────────
const SUBJECTS = [
    "English", "Mathematics", "Biology", "Chemistry",
    "Physics", "History", "Geography", "Chichewa",
];

// ─── MOCK DATA keyed by year ──────────────────────────────────────────────────
const MOCK_BY_YEAR = {
    "2025": {
        1: { label: "Form 1",        male: 148, female: 132, disabilities: { male: 4, female: 3 }, passRate: 81.4, attendance: 94.2 },
        2: { label: "Form 2 (JCE)",  male: 139, female: 121, disabilities: { male: 3, female: 2 }, passRate: 74.8, attendance: 91.7 },
        3: { label: "Form 3",        male: 124, female: 118, disabilities: { male: 2, female: 4 }, passRate: 78.3, attendance: 92.5 },
        4: { label: "Form 4 (MSCE)", male: 110, female: 107, disabilities: { male: 3, female: 2 }, passRate: 68.9, attendance: 89.3 },
    },
    "2024": {
        1: { label: "Form 1",        male: 140, female: 125, disabilities: { male: 3, female: 3 }, passRate: 79.2, attendance: 93.1 },
        2: { label: "Form 2 (JCE)",  male: 131, female: 115, disabilities: { male: 2, female: 2 }, passRate: 71.5, attendance: 90.8 },
        3: { label: "Form 3",        male: 118, female: 110, disabilities: { male: 2, female: 3 }, passRate: 75.8, attendance: 91.4 },
        4: { label: "Form 4 (MSCE)", male: 104, female:  98, disabilities: { male: 2, female: 2 }, passRate: 65.3, attendance: 88.6 },
    },
    "2023": {
        1: { label: "Form 1",        male: 135, female: 120, disabilities: { male: 3, female: 2 }, passRate: 77.1, attendance: 92.0 },
        2: { label: "Form 2 (JCE)",  male: 126, female: 108, disabilities: { male: 2, female: 2 }, passRate: 70.0, attendance: 89.5 },
        3: { label: "Form 3",        male: 112, female: 105, disabilities: { male: 1, female: 3 }, passRate: 73.4, attendance: 90.2 },
        4: { label: "Form 4 (MSCE)", male:  98, female:  92, disabilities: { male: 2, female: 1 }, passRate: 63.1, attendance: 87.9 },
    },
    "2022": {
        1: { label: "Form 1",        male: 128, female: 114, disabilities: { male: 2, female: 2 }, passRate: 75.5, attendance: 91.3 },
        2: { label: "Form 2 (JCE)",  male: 120, female: 102, disabilities: { male: 2, female: 1 }, passRate: 68.7, attendance: 88.4 },
        3: { label: "Form 3",        male: 108, female:  99, disabilities: { male: 1, female: 2 }, passRate: 71.2, attendance: 89.7 },
        4: { label: "Form 4 (MSCE)", male:  92, female:  88, disabilities: { male: 2, female: 1 }, passRate: 61.4, attendance: 86.1 },
    },
    "2021": {
        1: { label: "Form 1",        male: 122, female: 110, disabilities: { male: 2, female: 2 }, passRate: 73.8, attendance: 90.5 },
        2: { label: "Form 2 (JCE)",  male: 115, female:  98, disabilities: { male: 1, female: 1 }, passRate: 67.2, attendance: 87.9 },
        3: { label: "Form 3",        male: 103, female:  94, disabilities: { male: 1, female: 2 }, passRate: 69.9, attendance: 88.6 },
        4: { label: "Form 4 (MSCE)", male:  88, female:  83, disabilities: { male: 1, female: 1 }, passRate: 59.7, attendance: 85.3 },
    },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function buildSchoolTotals(forms) {
    const all = Object.values(forms);
    const totalMale   = all.reduce((s, f) => s + f.male,   0);
    const totalFemale = all.reduce((s, f) => s + f.female, 0);
    const disabMale   = all.reduce((s, f) => s + f.disabilities.male,   0);
    const disabFemale = all.reduce((s, f) => s + f.disabilities.female, 0);
    return {
        totalStudents:    totalMale + totalFemale,
        totalMale,
        totalFemale,
        totalDisabilities: disabMale + disabFemale,
        disabMale,
        disabFemale,
        overallPassRate:  (all.reduce((s, f) => s + f.passRate,   0) / all.length).toFixed(1),
        avgAttendance:    (all.reduce((s, f) => s + f.attendance, 0) / all.length).toFixed(1),
        genderRatio:      ((totalFemale / (totalMale + totalFemale)) * 100).toFixed(1),
    };
}

function getSubjectPassRates(formKey, yearValue) {
    const seed = parseInt(yearValue) + formKey;
    return SUBJECTS.map((sub, i) => ({
        subject:  sub,
        passRate: parseFloat((55 + ((seed * 7 + i * 13) % 30)).toFixed(1)),
    }));
}

function buildReportData(classValue, yearValue) {
    const cls     = CLASS_OPTIONS.find(c => c.value === classValue);
    const yearObj = ACADEMIC_YEARS.find(y => y.value === yearValue);
    if (!cls || !yearObj) return null;

    const yearForms    = MOCK_BY_YEAR[yearValue] || MOCK_BY_YEAR["2025"];
    const formsData    = cls.forms.map(k => ({ key: k, ...yearForms[k], subjectRates: getSubjectPassRates(k, yearValue) }));
    const schoolTotals = buildSchoolTotals(yearForms);

    const prevYear  = String(parseInt(yearValue) - 1);
    const prevForms = MOCK_BY_YEAR[prevYear];
    const trend     = prevForms
        ? cls.forms.map(k => ({ key: k, delta: parseFloat((yearForms[k].passRate - prevForms[k].passRate).toFixed(1)) }))
        : null;

    return { cls, yearObj, formsData, schoolTotals, trend, generatedAt: new Date() };
}

// ─── PRINT ────────────────────────────────────────────────────────────────────
function printReport(report) {
    const { cls, yearObj, formsData, schoolTotals, trend } = report;
    const meta = SCHOOL_META;

    const logoHtml = meta.systemLogo
        ? `<img src="${meta.systemLogo}" alt="Logo" style="height:56px;object-fit:contain;"/>`
        : `<div style="width:52px;height:52px;border-radius:13px;background:linear-gradient(135deg,#10b981,#15803d);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:900;flex-shrink:0">ODS</div>`;

    const classRows = formsData.map(f => {
        const total     = f.male + f.female;
        const noDisab   = total - f.disabilities.male - f.disabilities.female;
        const chip      = f.passRate >= 75 ? "pass-good" : f.passRate >= 60 ? "pass-mid" : "pass-low";
        const trendRow  = trend ? trend.find(t => t.key === f.key) : null;
        const trendHtml = trendRow
            ? `<span class="trend ${trendRow.delta >= 0 ? "trend-up" : "trend-dn"}">${trendRow.delta >= 0 ? "▲" : "▼"} ${Math.abs(trendRow.delta)}%</span>`
            : "";
        return `<tr>
            <td class="td-class">${f.label}</td>
            <td><strong>${total}</strong></td>
            <td>${f.male}</td>
            <td>${f.female}</td>
            <td>${((f.female / total) * 100).toFixed(0)}%</td>
            <td>${f.disabilities.male + f.disabilities.female}</td>
            <td>${noDisab}</td>
            <td>${f.attendance}%</td>
            <td><span class="chip ${chip}">${f.passRate}%</span> ${trendHtml}</td>
        </tr>`;
    }).join("");

    const subjectSection = formsData.map(f => `
        <div class="subject-block">
            <div class="sub-title">${f.label} — Subject Pass Rates</div>
            <div class="sub-grid">
                ${f.subjectRates.map(s => {
                    const cls2 = s.passRate >= 75 ? "pass-good" : s.passRate >= 60 ? "pass-mid" : "pass-low";
                    return `<div class="sub-card">
                        <div class="sub-name">${s.subject}</div>
                        <div class="sub-bar-bg"><div class="sub-bar ${cls2}" style="width:${s.passRate}%"></div></div>
                        <div class="sub-val ${cls2.replace("pass-", "sv-")}">${s.passRate}%</div>
                    </div>`;
                }).join("")}
            </div>
        </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${meta.schoolName} — ${cls.label} ${yearObj.label}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif;color:#1e293b;background:#fff;padding:28px 36px;font-size:12.5px;line-height:1.5}
  .page-header{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:3px solid #10b981;margin-bottom:20px}
  .sys-name{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#10b981;margin-bottom:2px}
  .sch-name{font-size:19px;font-weight:800;color:#0e5f2e;letter-spacing:-.03em}
  .sch-meta{font-size:11px;color:#64748b;margin-top:3px;display:flex;flex-wrap:wrap;gap:12px}
  .sch-meta span{display:flex;align-items:center;gap:4px}
  .report-banner{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6ee7b7;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start}
  .rb-title{font-size:15px;font-weight:800;color:#065f46}
  .rb-sub{font-size:11px;color:#059669;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap}
  .rb-meta{font-size:10.5px;color:#64748b;text-align:right;line-height:1.7}
  .section-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin:20px 0 9px;display:flex;align-items:center;gap:7px}
  .section-label::after{content:"";flex:1;height:1px;background:#e2e8f0}
  .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin-bottom:4px}
  .stat-card{border:1px solid #e2e8f0;border-radius:10px;padding:11px 14px}
  .stat-card.hl{border-color:#6ee7b7;background:#f0fdf4}
  .stat-val{font-size:22px;font-weight:900;color:#0e5f2e;font-family:'DM Mono',monospace;letter-spacing:-.02em}
  .stat-val.blue{color:#2563eb}.stat-val.pink{color:#db2777}.stat-val.amber{color:#d97706}.stat-val.teal{color:#0d9488}
  .stat-lbl{font-size:9.5px;color:#94a3b8;margin-top:3px;font-weight:500}
  .table-wrap{border-radius:11px;overflow:hidden;border:1px solid #e2e8f0;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:linear-gradient(135deg,#059669,#065f46)}
  thead th{padding:10px 12px;text-align:left;color:white;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:9px 12px}
  .td-class{font-weight:700;color:#0e5f2e}
  .chip{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;font-family:'DM Mono',monospace}
  .pass-good{background:#dcfce7;color:#15803d}
  .pass-mid{background:#fef3c7;color:#92400e}
  .pass-low{background:#fee2e2;color:#991b1b}
  .trend{font-size:10px;font-weight:700;margin-left:5px}
  .trend-up{color:#059669}.trend-dn{color:#dc2626}
  .subject-block{margin-bottom:14px}
  .sub-title{font-size:11.5px;font-weight:700;color:#15803d;margin-bottom:8px}
  .sub-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  .sub-card{border:1px solid #e2e8f0;border-radius:9px;padding:8px 10px}
  .sub-name{font-size:10.5px;font-weight:600;color:#334155;margin-bottom:5px}
  .sub-bar-bg{height:5px;background:#f1f5f9;border-radius:999px;overflow:hidden;margin-bottom:4px}
  .sub-bar{height:100%;border-radius:999px}
  .sub-bar.pass-good{background:#10b981}.sub-bar.pass-mid{background:#f59e0b}.sub-bar.pass-low{background:#ef4444}
  .sub-val{font-size:11.5px;font-weight:700;font-family:'DM Mono',monospace}
  .sv-good{color:#15803d}.sv-mid{color:#92400e}.sv-low{color:#991b1b}
  .sig-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:22px}
  .sig-block{border-top:1px solid #334155;padding-top:8px}
  .sig-label{font-size:9.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em}
  .sig-name{font-size:12px;font-weight:700;color:#1e293b;margin-top:4px}
  .sig-role{font-size:10.5px;color:#64748b}
  .page-footer{margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;color:#94a3b8}
  .footer-brand{display:flex;align-items:center;gap:6px;font-weight:700;color:#10b981}
  .footer-conf{background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:999px;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:.07em}
  @media print{body{padding:15mm 18mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0;size:A4}.subject-block{page-break-inside:avoid}.table-wrap{page-break-inside:avoid}}
</style></head><body>

<div class="page-header">
  <div style="display:flex;gap:14px;align-items:center;flex:1">
    ${logoHtml}
    <div>
      <div class="sys-name">${meta.systemName}</div>
      <div class="sch-name">${meta.schoolName}</div>
      <div class="sch-meta">
        <span><i class="bi bi-person-fill" style="margin-right:4px;vertical-align:middle"></i> ${meta.managerName}</span>
        <span><i class="bi bi-geo-alt-fill" style="margin-right:4px;vertical-align:middle"></i> ${meta.address}</span>
        <span><i class="bi bi-tag-fill" style="margin-right:4px;vertical-align:middle"></i> Code: ${meta.schoolCode}</span>
        <span><i class="bi bi-globe" style="margin-right:4px;vertical-align:middle"></i> ${meta.region}</span>
      </div>
    </div>
  </div>
  <div style="text-align:right;font-size:10px;color:#94a3b8;line-height:1.8">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#10b981;font-weight:700">OFFICIAL REPORT</div>
    <div>Date: ${report.generatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
    <div>Time: ${report.generatedAt.toLocaleTimeString()}</div>
    <div style="margin-top:4px;background:#f0fdf4;border:1px solid #6ee7b7;border-radius:6px;padding:2px 8px;display:inline-block;font-weight:700;color:#065f46">DRAFT</div>
  </div>
</div>

<div class="report-banner">
  <div>
    <div class="rb-title">${cls.label} Performance Report</div>
    <div class="rb-sub">
      <span><i class="bi bi-calendar-event" style="margin-right:4px;vertical-align:middle"></i> Academic Year: ${yearObj.label}</span>
      <span><i class="bi bi-building" style="margin-right:4px;vertical-align:middle"></i> ${meta.schoolName}</span>
    </div>
  </div>
  <div class="rb-meta">
    Generated: ${report.generatedAt.toLocaleDateString()}<br/>
    ${report.generatedAt.toLocaleTimeString()}<br/>
    Ref: RPT-${report.generatedAt.getFullYear()}-${String(report.generatedAt.getMonth() + 1).padStart(2, "0")}${String(report.generatedAt.getDate()).padStart(2, "0")}
  </div>
</div>

<div class="section-label">School-Wide Enrolment Summary</div>
<div class="stats-grid">
  <div class="stat-card hl"><div class="stat-val">${schoolTotals.totalStudents.toLocaleString()}</div><div class="stat-lbl">Total Students</div></div>
  <div class="stat-card"><div class="stat-val blue">${schoolTotals.totalMale.toLocaleString()}</div><div class="stat-lbl">Total Male</div></div>
  <div class="stat-card"><div class="stat-val pink">${schoolTotals.totalFemale.toLocaleString()}</div><div class="stat-lbl">Total Female</div></div>
  <div class="stat-card"><div class="stat-val teal">${schoolTotals.genderRatio}%</div><div class="stat-lbl">Female Ratio</div></div>
  <div class="stat-card hl"><div class="stat-val" style="color:#10b981">${schoolTotals.overallPassRate}%</div><div class="stat-lbl">Overall Pass Rate</div></div>
</div>

<div class="section-label">Attendance &amp; Inclusion</div>
<div class="stats-grid">
  <div class="stat-card hl"><div class="stat-val teal">${schoolTotals.avgAttendance}%</div><div class="stat-lbl">Avg Attendance</div></div>
  <div class="stat-card"><div class="stat-val amber">${schoolTotals.totalDisabilities}</div><div class="stat-lbl">Students w/ Disabilities</div></div>
  <div class="stat-card"><div class="stat-val blue">${schoolTotals.disabMale}</div><div class="stat-lbl">Disab. Male</div></div>
  <div class="stat-card"><div class="stat-val pink">${schoolTotals.disabFemale}</div><div class="stat-lbl">Disab. Female</div></div>
  <div class="stat-card"><div class="stat-val" style="color:#6366f1">${(schoolTotals.totalStudents - schoolTotals.totalDisabilities).toLocaleString()}</div><div class="stat-lbl">No Disability</div></div>
</div>

<div class="section-label">Class Performance Breakdown — ${cls.label}</div>
<div class="table-wrap">
  <table>
    <thead><tr>
      <th>Class</th><th>Total</th><th>Male</th><th>Female</th><th>F Ratio</th>
      <th>Disabilities</th><th>No Disab.</th><th>Attendance</th><th>Pass Rate</th>
    </tr></thead>
    <tbody>${classRows}</tbody>
  </table>
</div>

<div class="section-label">Subject Pass Rate Analysis</div>
${subjectSection}

<div class="sig-section">
  <div class="sig-block">
    <div style="height:32px"></div>
    <div class="sig-label">Prepared by</div>
    <div class="sig-name">${meta.managerName}</div>
    <div class="sig-role">School Manager</div>
  </div>
  <div class="sig-block">
    <div style="height:32px"></div>
    <div class="sig-label">Verified by</div>
    <div class="sig-name">_______________________</div>
    <div class="sig-role">Regional Education Officer</div>
  </div>
  <div class="sig-block">
    <div style="height:32px"></div>
    <div class="sig-label">Date Submitted</div>
    <div class="sig-name">_______________________</div>
    <div class="sig-role">Official Stamp</div>
  </div>
</div>

<div class="page-footer">
  <div class="footer-brand">
    <span>📊</span>
    <span>${meta.systemName} — Official School Performance Report | ${yearObj.label}</span>
  </div>
  <div style="display:flex;align-items:center;gap:10px">
    <span>${meta.schoolName} | ${meta.region}</span>
    <span class="footer-conf">Confidential</span>
  </div>
</div>

<script>window.onload = () => { setTimeout(() => window.print(), 300); }<\/script>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCSV(report) {
    const { cls, yearObj, formsData, schoolTotals } = report;
    const meta = SCHOOL_META;

    const rows = [
        ["SYSTEM",         meta.systemName],
        ["SCHOOL",         meta.schoolName],
        ["CODE",           meta.schoolCode],
        ["REGION",         meta.region],
        ["MANAGER",        meta.managerName],
        ["ADDRESS",        meta.address],
        ["ACADEMIC YEAR",  yearObj.label],
        ["CLASS / SCOPE",  cls.label],
        ["GENERATED ON",   report.generatedAt.toLocaleString()],
        [],
        ["── SCHOOL-WIDE SUMMARY ──"],
        ["Total Students",             schoolTotals.totalStudents],
        ["Total Male",                 schoolTotals.totalMale],
        ["Total Female",               schoolTotals.totalFemale],
        ["Female Ratio (%)",           schoolTotals.genderRatio],
        ["Students with Disabilities", schoolTotals.totalDisabilities],
        ["Disab. Male",                schoolTotals.disabMale],
        ["Disab. Female",              schoolTotals.disabFemale],
        ["Overall Pass Rate",          `${schoolTotals.overallPassRate}%`],
        ["Avg Attendance",             `${schoolTotals.avgAttendance}%`],
        [],
        ["── CLASS BREAKDOWN ──"],
        ["Class", "Total", "Male", "Female", "F Ratio%", "Disab. M", "Disab. F", "No Disability", "Attendance%", "Pass Rate"],
        ...formsData.map(f => {
            const total = f.male + f.female;
            return [
                f.label, total, f.male, f.female,
                ((f.female / total) * 100).toFixed(1),
                f.disabilities.male, f.disabilities.female,
                total - f.disabilities.male - f.disabilities.female,
                f.attendance,
                `${f.passRate}%`,
            ];
        }),
        [],
        ["── SUBJECT PASS RATES ──"],
        ["Class", ...SUBJECTS],
        ...formsData.map(f => [f.label, ...f.subjectRates.map(s => `${s.passRate}%`)]),
    ];

    const csv  = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${meta.schoolName.replace(/\s+/g, "_")}_${cls.label.replace(/[\s()]/g, "_")}_${yearObj.label.replace(/[\s/]/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SchoolReports() {
    const [selectedYear,  setSelectedYear]  = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [reportData,    setReportData]    = useState(null);
    const [isGenerating,  setIsGenerating]  = useState(false);
    const [isSubmitting,  setIsSubmitting]  = useState(false);
    const [showModal,     setShowModal]     = useState(false);
    const [activeTab,     setActiveTab]     = useState("overview");
    const [toast,         setToast]         = useState({ show: false, message: "", variant: "success" });

    const canGenerate = selectedYear && selectedClass;

    const handleGenerate = () => {
        if (!canGenerate) {
            setToast({ show: true, message: "Please select both an Academic Year and a Class.", variant: "warning" });
            return;
        }
        setIsGenerating(true);
        setReportData(null);
        setTimeout(() => {
            setReportData(buildReportData(selectedClass, selectedYear));
            setIsGenerating(false);
            setToast({ show: true, message: "Report generated successfully!", variant: "success" });
        }, 900);
    };

    const handleDiscard = () => { setReportData(null); setShowModal(false); };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setReportData(null);
            setSelectedYear("");
            setSelectedClass("");
            setIsSubmitting(false);
            setShowModal(false);
            setToast({ show: true, message: "Report submitted to Region Manager successfully.", variant: "success" });
        }, 1200);
    };

    const yearLabel = ACADEMIC_YEARS.find(y => y.value === selectedYear)?.label;
    const classItem = CLASS_OPTIONS.find(c => c.value === selectedClass);

    return (
        <>
            <ToastNote
                show={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
                message={toast.message}
                variant={toast.variant}
            />

            {showModal && reportData && (
                <ReportModal
                    report={reportData}
                    isSubmitting={isSubmitting}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onClose={() => setShowModal(false)}
                    onDiscard={handleDiscard}
                    onSubmit={handleSubmit}
                    onExportCSV={() => exportCSV(reportData)}
                    onPrint={() => printReport(reportData)}
                />
            )}

            <div className="sr-wrapper">

                {/* ── Header ── */}
                <div className="sr-header">
                    <div className="sr-header-icon">
                        <i className="bi bi-file-earmark-bar-graph"></i>
                    </div>
                    <div className="sr-header-text">
                        <div className="sr-header-title">School Reports</div>
                        <div className="sr-header-sub">
                            Generate JCE, MSCE, and whole-school reports by academic year.
                            Preview, print, export CSV, or submit to region.
                        </div>
                    </div>
                </div>

                {/* ── Generator Card ── */}
                <div className="sr-card">
                    <div className="sr-card-head">
                        <div>
                            <div className="sr-card-title">Report Generator</div>
                            <div className="sr-card-sub">Select academic year and class scope, then generate</div>
                        </div>
                    </div>
                    <div className="sr-card-body">

                        <div className="sr-generator-grid">
                            {/* Academic Year */}
                            <div className="sr-field">
                                <label className="sr-label">
                                    <i className="bi bi-calendar-range"></i>&nbsp; Academic Year
                                </label>
                                <div className="sr-select-wrap">
                                    <select
                                        className="sr-select"
                                        value={selectedYear}
                                        onChange={e => { setSelectedYear(e.target.value); setReportData(null); }}
                                    >
                                        <option value="">Select Academic Year...</option>
                                        {ACADEMIC_YEARS.map(y => (
                                            <option key={y.value} value={y.value}>{y.label}</option>
                                        ))}
                                    </select>
                                    <i className="bi bi-chevron-down sr-select-chevron"></i>
                                </div>
                            </div>

                            {/* Class / Scope */}
                            <div className="sr-field">
                                <label className="sr-label">
                                    <i className="bi bi-people"></i>&nbsp; Class / Scope
                                </label>
                                <div className="sr-select-wrap">
                                    <select
                                        className="sr-select"
                                        value={selectedClass}
                                        onChange={e => { setSelectedClass(e.target.value); setReportData(null); }}
                                    >
                                        <option value="">Select Class...</option>
                                        {CLASS_OPTIONS.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    <i className="bi bi-chevron-down sr-select-chevron"></i>
                                </div>
                            </div>
                        </div>

                        {(selectedYear || selectedClass) && (
                            <div className="sr-selection-preview">
                                {selectedYear && (
                                    <span className="sr-sel-pill">
                                        <i className="bi bi-calendar3"></i> {yearLabel}
                                    </span>
                                )}
                                {selectedYear && selectedClass && (
                                    <i className="bi bi-arrow-right sr-sel-arrow"></i>
                                )}
                                {selectedClass && classItem && (
                                    <span className="sr-sel-pill sr-sel-pill--class">
                                        <i className={classItem.icon}></i> {classItem.label}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="sr-actions">
                            <button
                                className="sr-btn sr-btn-primary"
                                onClick={handleGenerate}
                                disabled={isGenerating || !canGenerate}
                            >
                                {isGenerating
                                    ? <><i className="bi bi-arrow-repeat sr-spin"></i> Generating...</>
                                    : <><i className="bi bi-lightning-fill"></i> Generate Report</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Report Ready Card ── */}
                {reportData && !isGenerating && (
                    <div className="sr-card sr-fade-up">
                        <div className="sr-card-head">
                            <div>
                                <div className="sr-card-title">Report Ready</div>
                                <div className="sr-card-sub">
                                    {reportData.cls.label} &mdash; Academic Year {reportData.yearObj.label}
                                </div>
                            </div>
                            <div className="sr-status-badge sr-status-draft">Draft</div>
                        </div>
                        <div className="sr-card-body">

                            <div className="sr-quick-stats">
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val">{reportData.schoolTotals.totalStudents.toLocaleString()}</div>
                                    <div className="sr-qs-lbl">Students</div>
                                </div>
                                <div className="sr-qs-divider"></div>
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val sr-val-blue">{reportData.schoolTotals.totalMale}</div>
                                    <div className="sr-qs-lbl">Male</div>
                                </div>
                                <div className="sr-qs-divider"></div>
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val sr-val-pink">{reportData.schoolTotals.totalFemale}</div>
                                    <div className="sr-qs-lbl">Female</div>
                                </div>
                                <div className="sr-qs-divider"></div>
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val sr-val-green">{reportData.schoolTotals.overallPassRate}%</div>
                                    <div className="sr-qs-lbl">Pass Rate</div>
                                </div>
                                <div className="sr-qs-divider"></div>
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val sr-val-amber">{reportData.schoolTotals.totalDisabilities}</div>
                                    <div className="sr-qs-lbl">Disabilities</div>
                                </div>
                                <div className="sr-qs-divider"></div>
                                <div className="sr-qs-item">
                                    <div className="sr-qs-val" style={{ color: "#0d9488" }}>{reportData.schoolTotals.avgAttendance}%</div>
                                    <div className="sr-qs-lbl">Attendance</div>
                                </div>
                            </div>

                            <div className="sr-divider"></div>

                            <div className="sr-document-preview">
                                <div className="sr-doc-icon">
                                    <i className="bi bi-file-earmark-text-fill"></i>
                                </div>
                                <div className="sr-doc-details">
                                    <div className="sr-doc-title">{reportData.cls.label} Report</div>
                                    <div className="sr-doc-meta">
                                        <span><i className="bi bi-calendar-range"></i> {reportData.yearObj.label}</span>
                                        <span><i className="bi bi-building"></i> {SCHOOL_META.schoolName}</span>
                                        <span><i className="bi bi-people"></i> {reportData.schoolTotals.totalStudents.toLocaleString()} students</span>
                                        <span><i className="bi bi-clock"></i> {reportData.generatedAt.toLocaleTimeString()}</span>
                                        <span><i className="bi bi-geo-alt"></i> {SCHOOL_META.region}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sr-divider"></div>

                            <div className="sr-actions sr-actions-right">
                                <button className="sr-btn sr-btn-ghost" onClick={handleDiscard}>
                                    <i className="bi bi-trash3"></i> Discard
                                </button>
                                <button className="sr-btn sr-btn-outline" onClick={() => { setActiveTab("overview"); setShowModal(true); }}>
                                    <i className="bi bi-eye"></i> Preview
                                </button>
                                <button className="sr-btn sr-btn-export" onClick={() => exportCSV(reportData)}>
                                    <i className="bi bi-filetype-csv"></i> Export CSV
                                </button>
                                <button className="sr-btn sr-btn-print" onClick={() => printReport(reportData)}>
                                    <i className="bi bi-printer-fill"></i> Print
                                </button>
                                <button className="sr-btn sr-btn-success" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting
                                        ? <><i className="bi bi-arrow-repeat sr-spin"></i> Submitting...</>
                                        : <><i className="bi bi-send-fill"></i> Submit to Region</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Empty State ── */}
                {!reportData && !isGenerating && (
                    <div className="sr-empty-state">
                        <i className="bi bi-clipboard-data"></i>
                        <h3>No Report Generated</h3>
                        <p>Select an academic year and class above, then click "Generate Report".</p>
                    </div>
                )}

            </div>
        </>
    );
}

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────
function ReportModal({ report, isSubmitting, activeTab, onTabChange, onClose, onDiscard, onSubmit, onExportCSV, onPrint }) {
    const { cls, yearObj, formsData, schoolTotals, trend } = report;
    const meta = SCHOOL_META;

    const TABS = [
        { id: "overview",  label: "Overview",  icon: "bi-bar-chart-line"  },
        { id: "subjects",  label: "Subjects",  icon: "bi-journal-bookmark" },
        { id: "inclusion", label: "Inclusion", icon: "bi-person-heart"     },
    ];

    return (
        <div className="sr-modal-overlay" onClick={onClose}>
            <div className="sr-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="sr-modal-header">
                    <div className="sr-modal-header-left">
                        <div className="sr-modal-logo">
                            {meta.systemLogo
                                ? <img src={meta.systemLogo} alt="logo" style={{ height: 36, objectFit: "contain" }} />
                                : <span className="sr-modal-logo-text">ODS</span>
                            }
                        </div>
                        <div>
                            <div className="sr-modal-sys-name">{meta.systemName}</div>
                            <div className="sr-modal-title">{cls.label} &mdash; {yearObj.label}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="sr-status-badge sr-status-draft">Draft</div>
                        <button className="sr-modal-close" onClick={onClose}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sr-modal-tabs">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`sr-tab-btn${activeTab === t.id ? " sr-tab-btn--active" : ""}`}
                            onClick={() => onTabChange(t.id)}
                        >
                            <i className={`bi ${t.icon}`}></i> {t.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="sr-modal-body">

                    {/* School banner */}
                    <div className="sr-modal-school-banner">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                            <div>
                                <div className="sr-msb-school">{meta.schoolName}</div>
                                <div className="sr-msb-meta">
                                    <span><i className="bi bi-person-badge"></i> {meta.managerName}</span>
                                    <span><i className="bi bi-geo-alt"></i> {meta.address}</span>
                                    <span><i className="bi bi-calendar-range"></i> {yearObj.label}</span>
                                    <span><i className="bi bi-clock"></i> {report.generatedAt.toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: "right", fontSize: 11, opacity: 0.85 }}>
                               
                                <div>Code: {meta.schoolCode}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === "overview" && (
                        <>
                            <div className="sr-modal-section-label">School-Wide Enrolment</div>
                            <div className="sr-modal-summary-grid">
                                <div className="sr-modal-stat sr-stat-highlight">
                                    <div className="sr-modal-stat-value">{schoolTotals.totalStudents.toLocaleString()}</div>
                                    <div className="sr-modal-stat-label">Total Students</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value sr-val-blue">{schoolTotals.totalMale.toLocaleString()}</div>
                                    <div className="sr-modal-stat-label">Total Male</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value sr-val-pink">{schoolTotals.totalFemale.toLocaleString()}</div>
                                    <div className="sr-modal-stat-label">Total Female</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value" style={{ color: "#0d9488" }}>{schoolTotals.genderRatio}%</div>
                                    <div className="sr-modal-stat-label">Female Ratio</div>
                                </div>
                            </div>

                            <div className="sr-modal-summary-grid" style={{ marginTop: 10 }}>
                                <div className="sr-modal-stat sr-stat-highlight">
                                    <div className="sr-modal-stat-value sr-val-green">{schoolTotals.overallPassRate}%</div>
                                    <div className="sr-modal-stat-label">Overall Pass Rate</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value" style={{ color: "#0d9488" }}>{schoolTotals.avgAttendance}%</div>
                                    <div className="sr-modal-stat-label">Avg Attendance</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value sr-val-amber">{schoolTotals.totalDisabilities}</div>
                                    <div className="sr-modal-stat-label">Students w/ Disabilities</div>
                                </div>
                                <div className="sr-modal-stat">
                                    <div className="sr-modal-stat-value" style={{ color: "#6366f1" }}>
                                        {(schoolTotals.totalStudents - schoolTotals.totalDisabilities).toLocaleString()}
                                    </div>
                                    <div className="sr-modal-stat-label">No Disability</div>
                                </div>
                            </div>

                            <div className="sr-modal-section-label">Class Performance Breakdown — {cls.label}</div>
                            <div className="sr-modal-table-wrap">
                                <table className="sr-modal-table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Total</th>
                                            <th>Male</th>
                                            <th>Female</th>
                                            <th>F%</th>
                                            <th>Attendance</th>
                                            <th>Pass Rate</th>
                                            {trend && <th>YoY</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formsData.map(f => {
                                            const total    = f.male + f.female;
                                            const trendRow = trend ? trend.find(t => t.key === f.key) : null;
                                            return (
                                                <tr key={f.key}>
                                                    <td className="sr-td-class">{f.label}</td>
                                                    <td className="sr-td-bold">{total}</td>
                                                    <td>{f.male}</td>
                                                    <td>{f.female}</td>
                                                    <td>{((f.female / total) * 100).toFixed(0)}%</td>
                                                    <td>
                                                        <span className={`sr-pass-chip ${f.attendance >= 90 ? "sr-pass-good" : f.attendance >= 80 ? "sr-pass-mid" : "sr-pass-low"}`}>
                                                            {f.attendance}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`sr-pass-chip ${f.passRate >= 75 ? "sr-pass-good" : f.passRate >= 60 ? "sr-pass-mid" : "sr-pass-low"}`}>
                                                            {f.passRate}%
                                                        </span>
                                                    </td>
                                                    {trend && (
                                                        <td>
                                                            {trendRow && (
                                                                <span className={`sr-trend-chip ${trendRow.delta >= 0 ? "sr-trend-up" : "sr-trend-dn"}`}>
                                                                    <i className={`bi ${trendRow.delta >= 0 ? "bi-arrow-up-short" : "bi-arrow-down-short"}`}></i>
                                                                    {Math.abs(trendRow.delta)}%
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ── SUBJECTS TAB ── */}
                    {activeTab === "subjects" && (
                        <>
                            <div className="sr-modal-section-label">Subject Pass Rates by Class</div>
                            {formsData.map(f => (
                                <div key={f.key} className="sr-subject-block">
                                    <div className="sr-subject-block-title">
                                        <i className="bi bi-journal-bookmark-fill"></i> {f.label}
                                    </div>
                                    <div className="sr-subject-grid">
                                        {f.subjectRates.map(s => (
                                            <div key={s.subject} className="sr-subject-card">
                                                <div className="sr-subj-name">{s.subject}</div>
                                                <div className="sr-subj-bar-bg">
                                                    <div
                                                        className={`sr-subj-bar ${s.passRate >= 75 ? "sr-subj-good" : s.passRate >= 60 ? "sr-subj-mid" : "sr-subj-low"}`}
                                                        style={{ width: `${s.passRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`sr-pass-chip ${s.passRate >= 75 ? "sr-pass-good" : s.passRate >= 60 ? "sr-pass-mid" : "sr-pass-low"}`}>
                                                    {s.passRate}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* ── INCLUSION TAB ── */}
                    {activeTab === "inclusion" && (
                        <>
                            <div className="sr-modal-section-label">Disability &amp; Inclusion Summary</div>
                            <div className="sr-modal-disab-grid">
                                <div className="sr-modal-disab-card">
                                    <i className="bi bi-people-fill sr-disab-icon sr-val-amber"></i>
                                    <div className="sr-modal-stat-value sr-val-amber">{schoolTotals.totalDisabilities}</div>
                                    <div className="sr-modal-stat-label">Total</div>
                                </div>
                                <div className="sr-modal-disab-card">
                                    <i className="bi bi-person-fill sr-disab-icon sr-val-blue"></i>
                                    <div className="sr-modal-stat-value sr-val-blue">{schoolTotals.disabMale}</div>
                                    <div className="sr-modal-stat-label">Male</div>
                                </div>
                                <div className="sr-modal-disab-card">
                                    <i className="bi bi-person-fill sr-disab-icon sr-val-pink"></i>
                                    <div className="sr-modal-stat-value sr-val-pink">{schoolTotals.disabFemale}</div>
                                    <div className="sr-modal-stat-label">Female</div>
                                </div>
                            </div>

                            <div className="sr-modal-section-label" style={{ marginTop: 18 }}>Per-Class Disability Breakdown</div>
                            <div className="sr-modal-table-wrap">
                                <table className="sr-modal-table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Total</th>
                                            <th>Disab. Male</th>
                                            <th>Disab. Female</th>
                                            <th>Total Disab.</th>
                                            <th>No Disability</th>
                                            <th>Incl. Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formsData.map(f => {
                                            const total    = f.male + f.female;
                                            const disab    = f.disabilities.male + f.disabilities.female;
                                            const inclRate = ((disab / total) * 100).toFixed(1);
                                            return (
                                                <tr key={f.key}>
                                                    <td className="sr-td-class">{f.label}</td>
                                                    <td className="sr-td-bold">{total}</td>
                                                    <td className="sr-val-blue">{f.disabilities.male}</td>
                                                    <td className="sr-val-pink">{f.disabilities.female}</td>
                                                    <td className="sr-val-amber sr-td-bold">{disab}</td>
                                                    <td>{total - disab}</td>
                                                    <td>
                                                        <span className={`sr-pass-chip ${inclRate >= 3 ? "sr-pass-mid" : "sr-pass-good"}`}>
                                                            {inclRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="sr-modal-section-label" style={{ marginTop: 18 }}>Gender Parity per Class</div>
                            {formsData.map(f => {
                                const total   = f.male + f.female;
                                const femPct  = Math.round((f.female / total) * 100);
                                const malePct = 100 - femPct;
                                return (
                                    <div key={f.key} className="sr-gender-bar-row">
                                        <div className="sr-gbr-label">{f.label}</div>
                                        <div className="sr-gbr-track">
                                            <div className="sr-gbr-male"   style={{ width: `${malePct}%` }}>
                                                {malePct > 12 && <span>{malePct}% M</span>}
                                            </div>
                                            <div className="sr-gbr-female" style={{ width: `${femPct}%` }}>
                                                {femPct > 12 && <span>{femPct}% F</span>}
                                            </div>
                                        </div>
                                        <div className="sr-gbr-total">{total}</div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <div className="sr-modal-notice">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        <span>
                            Submitting sends this report to the Region Manager for verification.
                            This action <strong>cannot be undone</strong>.
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="sr-modal-footer">
                    <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={onDiscard}>
                        <i className="bi bi-trash3"></i> Discard
                    </button>
                    <div className="sr-modal-footer-right">
                        <button className="sr-btn sr-btn-export sr-btn-sm" onClick={onExportCSV}>
                            <i className="bi bi-filetype-csv"></i> CSV
                        </button>
                        <button className="sr-btn sr-btn-print sr-btn-sm" onClick={onPrint}>
                            <i className="bi bi-printer-fill"></i> Print
                        </button>
                        <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={onClose}>
                            Close
                        </button>
                        <button className="sr-btn sr-btn-success sr-btn-sm" onClick={onSubmit} disabled={isSubmitting}>
                            {isSubmitting
                                ? <><i className="bi bi-arrow-repeat sr-spin"></i> Submitting...</>
                                : <><i className="bi bi-send-fill"></i> Submit to Region</>
                            }
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}