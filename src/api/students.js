// All students nationally (super admin). Schools use schoolPortal.js instead.
import client, { data, list } from "./client";

export const listStudents = () => client.get("/admin/students").then(list);
export const getStudent = (id) => client.get(`/admin/students/${id}`).then(data);
export const createStudent = (student) => client.post("/admin/students", student).then(data);
export const updateStudent = (id, student) => client.put(`/admin/students/${id}`, student).then(data);
export const deleteStudent = (id) => client.delete(`/admin/students/${id}`).then(data);
