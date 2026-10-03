// Schools. Reads are open to every role; changes are super-admin only.
import client, { data, list, params } from "./client";

// filters: { district_id }
export const listSchools = (filters) => client.get("/admin/schools", { params: params(filters) }).then(list);
export const getSchool = (id) => client.get(`/admin/schools/${id}`).then(data);
export const createSchool = (school) => client.post("/admin/schools", school).then(data);
export const updateSchool = (id, school) => client.put(`/admin/schools/${id}`, school).then(data);
export const deleteSchool = (id) => client.delete(`/admin/schools/${id}`).then(data);
