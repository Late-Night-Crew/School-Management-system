import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { formatDate } from "../../utils/format";
import { FORMS, LOCATIONS, VENUES, totalEnrolment } from "./shared";

// A copy of a school request laid out like MCDE's paper "Registration form for an Open
// Secondary School", for the division to keep. Parts not yet reached are left blank.
// Signatures and stamps are not used (client decision).

const MARGIN = 16;
const GRID = { theme: "grid", styles: { fontSize: 9, cellPadding: 2, lineColor: 120, lineWidth: 0.2, textColor: 20 } };
const LABEL = { fontStyle: "bold", cellWidth: 55 };

const box = (checked) => (checked ? "[X]" : "[  ]");
const blank = (value) => (value === null || value === undefined || value === "" ? "" : String(value));

export function downloadRequestPdf(request) {
  const form = request.form;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  let y = 18;

  const heading = (text) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(text, MARGIN, y);
    y += 3;
  };
  const table = (options) => {
    autoTable(doc, { ...GRID, startY: y, margin: { left: MARGIN, right: MARGIN }, ...options });
    y = doc.lastAutoTable.finalY + 7;
  };
  const rows = (pairs) => table({ body: pairs.map(([label, value]) => [label, blank(value)]), columnStyles: { 0: LABEL } });

  // Letterhead
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  ["Private Bag 302", "Chichiri", "Blantyre 3"].forEach((line, i) => doc.text(line, width - MARGIN, y + i * 4.5, { align: "right" }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("MALAWI COLLEGE OF DISTANCE EDUCATION", width / 2, y + 16, { align: "center" });
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 19, width - MARGIN, y + 19);
  doc.setFontSize(11);
  doc.text("Registration form for an Open Secondary School", width / 2, y + 26, { align: "center" });
  y += 34;

  heading("PART A (completed for the head teacher of the host institution)");
  rows([
    ["School name", form.school_name],
    ["District", request.district_name],
    ["Division", request.region_name],
    ["Location", LOCATIONS.map((l) => `${box(form.location === l.value)} ${l.label}`).join("     ")],
  ]);

  heading("SCHOOL DETAILS");
  rows([["Address", form.address]]);

  heading("Head teacher's details");
  rows([
    ["Name", form.head_teacher.name],
    ["Phone number", form.head_teacher.phone],
    ["Email address", form.head_teacher.email],
  ]);

  heading("PLACE TO RUN THE OSS");
  table({
    body: VENUES.map((v) => [`${box(form.venue_type === v.value)} ${v.label}`, form.venue_type === v.value ? blank(form.venue_name) : ""]),
    columnStyles: { 0: { cellWidth: 70 } },
  });

  heading("Teachers/facilitators available");
  const facilitators = form.facilitators.length ? form.facilitators : [{}];
  table({
    head: [["No.", "Name", "Qualification", "Subject combination"]],
    body: facilitators.map((f, i) => [i + 1, blank(f.name), blank(f.qualification), blank(f.subject_combination)]),
    headStyles: { fillColor: [235, 235, 235], textColor: 20, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 12 } },
  });

  heading("Recommended coordinator for the open secondary school");
  rows([
    ["Name", form.coordinator.name],
    ["Qualifications", form.coordinator.qualifications],
    ["Email address", form.coordinator.email],
    ["Phone number", form.coordinator.phone],
  ]);

  heading("Initial enrolment");
  table({
    head: [["Class", "Enrolment"]],
    body: [
      ...FORMS.map((key, i) => [`Form ${i + 1}`, blank(form.enrolment[key])]),
      [{ content: "Total", styles: { fontStyle: "bold" } }, String(totalEnrolment(form.enrolment))],
    ],
    headStyles: { fillColor: [235, 235, 235], textColor: 20, fontStyle: "bold" },
  });
  rows([["Distance from the next open secondary school", form.distance_km == null ? "" : `${form.distance_km} km`]]);

  heading("PART B (PTA/Board of Governors and EDM)");
  y += 5;
  heading("PTA/Board of Governors members");
  const members = form.pta_members.length ? form.pta_members : [""];
  table({
    head: [["No.", "Name"]],
    body: members.map((name, i) => [i + 1, blank(name)]),
    headStyles: { fillColor: [235, 235, 235], textColor: 20, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 12 } },
  });

  heading("Education Division Manager (EDM)");
  rows([
    ["Recommendation", request.submitted_at ? "Recommended (submitted to MCDE)" : ""],
    ["Name", request.submitted_by_name],
    ["Date", request.submitted_at ? formatDate(request.submitted_at) : ""],
  ]);

  heading("PART C FOR OFFICIAL USE ONLY");
  const decided = request.status === "Accepted";
  rows([
    ["The application has been", `${box(decided)} Accepted`],
    ["Registration number", request.registration_number],
    ["Name", decided ? request.decided_by_name : ""],
    ["Position", decided ? "Learner Support Manager, MCDE" : ""],
    ["Date", decided ? formatDate(request.decided_at) : ""],
  ]);

  // Footer on every page: where the copy came from
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.text(
      `Open Secondary School system · Request #${request.id} · Status: ${request.status} · Printed ${formatDate(new Date().toISOString())}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    doc.setTextColor(0);
  }

  const safeName = (form.school_name || "school").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "");
  doc.save(`OSS_registration_${safeName}_${request.id}.pdf`);
}
