// National academic years. Reads are open to every role; changes are super-admin only.
import client, { data, list } from "./client";

export const listAcademicYears = () => client.get("/admin/academic_years").then(list);
export const getAcademicYear = (id) => client.get(`/admin/academic_years/${id}`).then(data);
export const createAcademicYear = (year) => client.post("/admin/academic_years", year).then(data);
export const updateAcademicYear = (id, year) => client.put(`/admin/academic_years/${id}`, year).then(data);
export const deleteAcademicYear = (id) => client.delete(`/admin/academic_years/${id}`).then(data);

// The year with status "Active", or null
export const getActiveAcademicYear = async () =>
  (await listAcademicYears()).find((year) => year.status === "Active") || null;

// When each term runs: [{ academic_year_id, year, term, start_date, end_date }]. Schools
// are reminded as their term ends (see docs/operations.md).
export const listTermDates = () => client.get("/admin/term_dates").then(list);
// terms: [{ term, start_date, end_date }]; replaces the year's term dates
export const setTermDates = (yearId, terms) => client.put(`/admin/academic_years/${yearId}/terms`, { terms }).then(list);
// Runs the reminder check now. Resolves to { date, sent: { ending, ended, ... }, schools_checked }
export const sendRemindersNow = () => client.post("/admin/reminders/run").then(data);
// When reminders go out, in days: { days_before, overdue_after, escalate_after }
export const getReminderSettings = () => client.get("/admin/reminder_settings").then(data);
export const saveReminderSettings = (settings) => client.put("/admin/reminder_settings", settings).then(data);
