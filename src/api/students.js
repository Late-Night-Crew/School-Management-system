// All students nationally (super admin). Schools use schoolPortal.js instead.
import client, { data, list, params } from "./client";

export const listStudents = () => client.get("/admin/students").then(list);
export const getStudent = (id) => client.get(`/admin/students/${id}`).then(data);
export const createStudent = (student) => client.post("/admin/students", student).then(data);
export const updateStudent = (id, student) => client.put(`/admin/students/${id}`, student).then(data);
export const deleteStudent = (id) => client.delete(`/admin/students/${id}`).then(data);

// Learners who may be the one being registered or edited (see findSimilarSchoolStudents)
export const findSimilarStudents = (check) => client.get("/admin/students/duplicates", { params: params(check) }).then(list);
