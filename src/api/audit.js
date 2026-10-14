// The activity log: who did what, for MCDE (super admins) only.
import client, { data, list, params } from "./client";

// filters: { actor_user_id, actor_role, entity_type, from, to, q, page, page_size }
// Resolves to { entries: [{ id, at, actor_user_id, actor_name, actor_role, action,
//               entity_type, entity_id, entity_label, note }], total, page, page_size }
export const listAuditLogs = (filters) => client.get("/admin/audit_logs", { params: params(filters) }).then(data);
// Everyone who appears in the log: [{ id, name, role, entries }]
export const listAuditActors = () => client.get("/admin/audit_logs/actors").then(list);
