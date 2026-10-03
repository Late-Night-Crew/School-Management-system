// Subjects. Reads are open to every role; changes are super-admin only.
import client, { data, list } from "./client";

export const listSubjects = () => client.get("/admin/subjects").then(list);
export const getSubject = (id) => client.get(`/admin/subjects/${id}`).then(data);
// subject: { code, name, description }
export const createSubject = (subject) => client.post("/admin/subjects", subject).then(data);
export const updateSubject = (id, subject) => client.put(`/admin/subjects/${id}`, subject).then(data);
export const deleteSubject = (id) => client.delete(`/admin/subjects/${id}`).then(data);
