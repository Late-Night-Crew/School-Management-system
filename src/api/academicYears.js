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
