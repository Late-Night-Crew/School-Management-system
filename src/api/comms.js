// Internal communication for every role. The backend works out who the caller speaks
// for (the ministry, their regional office or their school) from the token.
//
// Notices: one-way, from the super admin or a regional admin to many recipients.
// Conversations: private two-party threads that any role can start, within the rules
// the backend enforces (see listContacts).
import client, { data, list, params } from "./client";

// Fired after anything that changes unread counts, so the sidebar badge refreshes at once
export const COMMS_CHANGED = "nsms:comms-changed";
const changed = (result) => {
  window.dispatchEvent(new Event(COMMS_CHANGED));
  return result;
};

// { unread_notices, open_tasks, unread_conversations }
export const getCommsSummary = () => client.get("/comms/summary").then(data);

export const listInbox = () => client.get("/comms/notices/inbox").then(list);
export const markNoticeRead = (id) => client.post(`/comms/notices/${id}/read`).then(changed);
export const markNoticeDone = (id) => client.post(`/comms/notices/${id}/done`).then(changed);

// audience_type: REGIONAL_ADMINS | REGIONAL_ADMIN | SCHOOLS_ALL | SCHOOLS_IN_REGION | SCHOOLS_IN_DISTRICT | SCHOOL
export const previewAudience = (audienceType, audienceId) =>
  client
    .get("/comms/notices/audience", { params: params({ audience_type: audienceType, audience_id: audienceId }) })
    .then(data);
// notice: { title, body, priority (Normal | Urgent), due_date (YYYY-MM-DD), audience_type, audience_id }
export const sendNotice = (notice) => client.post("/comms/notices", notice).then(data);
export const listSentNotices = () => client.get("/comms/notices/sent").then(list);
export const listNoticeRecipients = (id) => client.get(`/comms/notices/${id}/recipients`).then(list);
export const remindPending = (id) => client.post(`/comms/notices/${id}/remind`).then(data);
export const withdrawNotice = (id, reason) => client.post(`/comms/notices/${id}/withdraw`, { reason });

// [{ type, id, label, group }]: everyone the caller may start a conversation with
export const listContacts = () => client.get("/comms/contacts").then(list);
export const listConversations = () => client.get("/comms/conversations").then(list);
export const listReportedConversations = () => client.get("/comms/conversations/reported").then(list);
// Opening a conversation marks it read
export const getConversation = (id) => client.get(`/comms/conversations/${id}`).then(data).then(changed);
// conversation: { to_type, to_id, subject, body }
export const startConversation = (conversation) => client.post("/comms/conversations", conversation).then(data);
export const sendMessage = (id, body) => client.post(`/comms/conversations/${id}/messages`, { body }).then(data);
export const reportConversation = (id, reason) => client.post(`/comms/conversations/${id}/report`, { reason });
