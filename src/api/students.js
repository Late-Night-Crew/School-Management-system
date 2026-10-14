// All students nationally (super admin). Schools use schoolPortal.js instead.
import client, { data, list, params } from "./client";

// Learner lists are paged on the server.
// filters: { q, region_id, district_id, school_id, form_level, status (Active | Left |
// Completed), page, page_size (up to 5000) }
// Resolves to { students: [student + school_name, district_name, region_name], total, page, page_size }
export const listStudents = (filters) => client.get("/admin/students", { params: params(filters) }).then(data);
export const getStudent = (id) => client.get(`/admin/students/${id}`).then(data);
export const createStudent = (student) => client.post("/admin/students", student).then(data);
export const updateStudent = (id, student) => client.put(`/admin/students/${id}`, student).then(data);
export const deleteStudent = (id) => client.delete(`/admin/students/${id}`).then(data);

// Learners who may be the one being registered or edited (see findSimilarSchoolStudents)
export const findSimilarStudents = (check) => client.get("/admin/students/duplicates", { params: params(check) }).then(list);

// MCDE: a learner who has left ({ status, left_on, reason }), or is back
export const markStudentLeft = (id, leave) => client.post(`/admin/students/${id}/leave`, leave);
export const reinstateStudent = (id) => client.post(`/admin/students/${id}/reinstate`);
