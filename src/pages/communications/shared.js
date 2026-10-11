// Helpers shared by the communications screens.
import { formatDate } from "../../utils/format";

export const DATE_TIME = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

export const PRIVACY_NOTE =
  "Conversations are private between the two sides. If either side reports one, the ministry (super admin) can read it.";

export const DATA_PROTECTION_HINT =
  "Messages are kept as official records and cannot be edited or deleted. Share only the student details that are needed.";

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Badge for a recipient's due date: done, overdue or due. Null when there is no due date.
export function dueStatus({ due_date: dueDate, done_at: doneAt }) {
  if (!dueDate) return null;
  if (doneAt) return { label: "Done", tone: "green" };
  if (dueDate < todayISO()) return { label: `Overdue · was due ${formatDate(dueDate)}`, tone: "red" };
  return { label: `Due ${formatDate(dueDate)}`, tone: "amber" };
}

export const isOverdue = (dueDate) => Boolean(dueDate) && dueDate < todayISO();
export { todayISO };
