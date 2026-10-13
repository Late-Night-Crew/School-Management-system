// Requests to register a new school (the online OSS registration form). Division
// officers create, edit, submit and delete their division's requests; the super admin
// accepts them (MCDE does not reject applications).
import client, { data, list, params } from "./client";

// filters: { status: "Draft" | "Submitted" | "Accepted" }
export const listSchoolRequests = (filters) => client.get("/school_requests", { params: params(filters) }).then(list);
export const getSchoolRequest = (id) => client.get(`/school_requests/${id}`).then(data);
export const createSchoolRequest = (form) => client.post("/school_requests", form).then(data);
export const updateSchoolRequest = (id, form) => client.put(`/school_requests/${id}`, form).then(data);
export const deleteSchoolRequest = (id) => client.delete(`/school_requests/${id}`).then(data);
export const submitSchoolRequest = (id) => client.post(`/school_requests/${id}/submit`).then(data);
// Registers the school and creates the coordinator's account.
// Returns { school_id, account?: { account, temporary_password }, account_error? }
export const acceptSchoolRequest = (id, registrationNumber) =>
  client.post(`/school_requests/${id}/accept`, { registration_number: registrationNumber }).then(data);

// Fired after a request changes, so the sidebar badge refreshes
export const SCHOOL_REQUESTS_CHANGED = "nsms:school-requests-changed";
export const notifySchoolRequestsChanged = () => window.dispatchEvent(new Event(SCHOOL_REQUESTS_CHANGED));
