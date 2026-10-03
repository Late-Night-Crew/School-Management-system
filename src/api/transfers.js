// Transfers for the super admin, who can act on any school's transfers.
// Lifecycle: Pending -> Accepted (student moves) -> Completed, or Pending -> Rejected.
import client, { data, list } from "./client";

export const listIncomingTransfers = (schoolId) =>
  client.get("/admin/transfers/incoming", { params: { school_id: schoolId } }).then(list);
export const listOutgoingTransfers = (schoolId) =>
  client.get("/admin/transfers/outgoing", { params: { school_id: schoolId } }).then(list);
export const getTransfer = (id) => client.get(`/admin/transfers/${id}`).then(data);

// transfer: { student_id, from_school, to_school, date_initiated (ISO), reason }
export const createTransfer = (transfer) => client.post("/admin/transfers", transfer).then(data);
export const approveTransfer = (id) => client.put(`/admin/transfers/${id}/approve`).then(data);
export const finalizeTransfer = (id) => client.patch(`/admin/transfers/${id}/finalize`).then(data);
export const rejectTransfer = (id, reason) => client.patch(`/admin/transfers/${id}/reject`, { reason }).then(data);
