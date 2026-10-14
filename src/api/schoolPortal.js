// Endpoints for a school manager, scoped to their own school (/school/:schoolId).
import client, { data, list, params } from "./client";

const base = (schoolId) => `/school/${schoolId}`;

export const getSchoolDashboard = (schoolId) => client.get(`${base(schoolId)}/dashboard`).then(data);

export const listSchoolStudents = (schoolId) => client.get(`${base(schoolId)}/students`).then(list);
export const getSchoolStudent = (schoolId, id) => client.get(`${base(schoolId)}/students/${id}`).then(data);
export const createSchoolStudent = (schoolId, student) =>
  client.post(`${base(schoolId)}/students`, student).then(data);
export const updateSchoolStudent = (schoolId, id, student) =>
  client.put(`${base(schoolId)}/students/${id}`, student).then(data);
export const deleteSchoolStudent = (schoolId, id) => client.delete(`${base(schoolId)}/students/${id}`).then(data);

export const listSchoolExamResults = (schoolId) => client.get(`${base(schoolId)}/exam_results`).then(list);

// Transfer lifecycle: Pending -> Accepted (by the receiving school; the student moves)
// -> Completed (by the sending school), or Pending -> Rejected (by the receiving school).
export const listSchoolIncomingTransfers = (schoolId) =>
  client.get(`${base(schoolId)}/transfers/incoming`).then(list);
export const listSchoolOutgoingTransfers = (schoolId) =>
  client.get(`${base(schoolId)}/transfers/outgoing`).then(list);
// transfer: { student_id, to_school, date_initiated (ISO), reason }
export const createSchoolTransfer = (schoolId, transfer) =>
  client.post(`${base(schoolId)}/transfers`, transfer).then(data);
export const approveSchoolTransfer = (schoolId, id) =>
  client.put(`${base(schoolId)}/transfers/${id}/approve`).then(data);
export const rejectSchoolTransfer = (schoolId, id, reason) =>
  client.patch(`${base(schoolId)}/transfers/${id}/reject`, { reason }).then(data);
export const finalizeSchoolTransfer = (schoolId, id) =>
  client.patch(`${base(schoolId)}/transfers/${id}/finalize`).then(data);

// Pass rates are numeric strings, e.g. { academic_year_id, jce_pass_rate: "78.5", msce_pass_rate: "64" }.
// A school has at most one result per academic year: create it once, then update it.
export const createSchoolExamResult = (schoolId, result) =>
  client.post(`${base(schoolId)}/exam_results`, result).then(data);
export const updateSchoolExamResult = (schoolId, id, result) =>
  client.put(`${base(schoolId)}/exam_results/${id}`, result).then(data);

// Per-student, per-subject marks (0-100) by academic year and term (1-3).
// filters: { academic_year_id, term, student_id }
export const listSchoolMarks = (schoolId, filters) =>
  client.get(`${base(schoolId)}/marks`, { params: params(filters) }).then(list);
// batch: { academic_year_id, term, marks: [{ student_id, subject_id, mark }] }; mark null clears it
export const saveSchoolMarks = (schoolId, batch) => client.put(`${base(schoolId)}/marks`, batch).then(data);

// Learners (at any school) who may be the one being registered or edited:
// check: { first_name, last_name, date_of_birth, guardian_phone, exclude_id }
// Resolves to [{ id, name, student_number, school_name, form_level, has_national_id, reason }]
export const findSimilarSchoolStudents = (schoolId, check) =>
  client.get(`${base(schoolId)}/students/duplicates`, { params: params(check) }).then(list);
