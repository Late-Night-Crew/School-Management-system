// Schools. Reads are open to every role; changes are super-admin only.
import client, { data, list, params } from "./client";

// filters: { district_id }
export const listSchools = (filters) => client.get("/admin/schools", { params: params(filters) }).then(list);
export const getSchool = (id) => client.get(`/admin/schools/${id}`).then(data);
export const createSchool = (school) => client.post("/admin/schools", school).then(data);
export const updateSchool = (id, school) => client.put(`/admin/schools/${id}`, school).then(data);
export const deleteSchool = (id) => client.delete(`/admin/schools/${id}`).then(data);

// What the school still has on record: { students, marks, transfers,
// unfinished_incoming_transfers, exam_results, active_accounts, closed, can_delete }
export const getSchoolUsage = (id) => client.get(`/admin/schools/${id}/usage`).then(data);
// Closing keeps every record, deactivates the school's accounts and stops new
// students, transfers and accounts. Returns { accounts_deactivated }.
export const closeSchool = (id, note) => client.post(`/admin/schools/${id}/close`, { note }).then(data);
export const reopenSchool = (id) => client.post(`/admin/schools/${id}/reopen`).then(data);
// Moves every student of the school to another open school as completed transfers.
// Students with a pending transfer are skipped. Returns { transferred, skipped }.
export const transferAllStudents = (id, toSchoolId, reason) =>
  client.post(`/admin/schools/${id}/transfer_students`, { to_school_id: toSchoolId, reason }).then(data);
