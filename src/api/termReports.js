// End-of-term reports. Each school's term is saved when it closes (Terms & Promotion),
// so past figures stay as they were; a report whose marks changed later is flagged
// out_of_date and can be regenerated. The current term is worked out live.
import client, { data, list, params } from "./client";

// base: "/school/:id" (coordinator) or "/admin/schools/:id" (MCDE); see api/promotion
// [{ academic_year_id, year, term, learners_assessed, average_mark, pass_rate,
//    jce_pass_rate, msce_pass_rate, details: { pass_mark, forms, subjects }, out_of_date, live }]
export const listTermReports = (base) => client.get(`${base}/term_reports`).then(list);
export const getTermReport = (base, yearId, term) => client.get(`${base}/term_reports/${yearId}/${term}`).then(data);
export const regenerateTermReport = (base, yearId, term) =>
  client.post(`${base}/term_reports/${yearId}/${term}/regenerate`).then(data);

// Every school's report for one term: filters { academic_year_id, term, region_id }.
// regionId set: a division officer's own division.
export const compareTerm = (filters, regionId) =>
  client.get(regionId ? `/region/${regionId}/term_reports` : "/admin/term_reports", { params: params(filters) }).then(list);

// { pass_mark, terms: [{ year, term, school_name, subjects_marked, subjects_passed, average_mark }] }
export const getLearnerProgress = (base, studentId) =>
  client.get(base.startsWith("/admin") ? `/admin/students/${studentId}/progress` : `${base}/students/${studentId}/progress`).then(data);
