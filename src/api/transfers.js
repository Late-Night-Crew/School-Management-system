// Transfers for the super admin, who can act on any school's transfers.
// Lifecycle: Pending -> Accepted (student moves) -> Completed, or Pending -> Rejected.
// Every action is recorded in the transfer's audit log with who did it and their note.
import client, { data, list, params } from "./client";

// filters: { status, region_id, district_id, school_id, date_from, date_to (YYYY-MM-DD), search, page, page_size }
// Returns { items, total, page, page_size, status_counts: { Pending, Accepted, Completed, Rejected } }
export const listTransferHistory = (filters) =>
  client.get("/admin/transfers", { params: params(filters) }).then(data);
export const getTransfer = (id) => client.get(`/admin/transfers/${id}`).then(data);
// Timeline entries: [{ id, action, actor_name, actor_role, actor_school_name, note, at }]
export const getTransferAudit = (id) => client.get(`/admin/transfers/${id}/audit`).then(list);

// Downloads every transfer matching the filters (paging is ignored) as a CSV file.
// The server records each export in the audit log.
export async function exportTransferHistory(filters) {
  const { page: _page, page_size: _pageSize, ...rest } = filters;
  const response = await client.get("/admin/transfers/export", { params: params(rest), responseType: "blob" });

  // Named here because browsers hide Content-Disposition from cross-origin requests
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transfers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// transfer: { student_id, from_school, to_school, date_initiated (ISO), reason }
export const createTransfer = (transfer) => client.post("/admin/transfers", transfer).then(data);
// The super admin approves on the receiving school's behalf, so a note is required
export const approveTransfer = (id, note) => client.put(`/admin/transfers/${id}/approve`, { note }).then(data);
export const finalizeTransfer = (id, note) => client.patch(`/admin/transfers/${id}/finalize`, { note }).then(data);
export const rejectTransfer = (id, reason) => client.patch(`/admin/transfers/${id}/reject`, { reason }).then(data);
