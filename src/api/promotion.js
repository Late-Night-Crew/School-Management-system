// Terms and the year-end promotion. A school moves Term 1 -> 2 -> 3; finishing Term 3
// records every learner's result, moves them (or not) to the next form and starts the
// next academic year. Coordinators work on their own school; MCDE on any school.
import client, { data, list, params } from "./client";

// Where a school's promotion endpoints live for the signed-in role
export const schoolPromotionBase = (isSuper, schoolId) => (isSuper ? `/admin/schools/${schoolId}` : `/school/${schoolId}`);

// { school_id, academic_year_id, year, term, next_year_id, next_year }
export const getStage = (base) => client.get(`${base}/stage`).then(data);
export const advanceTerm = (base) => client.post(`${base}/stage/advance`).then(data);
// { stage, automatic, subjects_to_pass, pass_mark,
//   learners: [{ student_id, name, student_number, form_level, subjects_passed, subjects_marked,
//                passed, recommended, allowed }] }
export const getYearEnd = (base) => client.get(`${base}/year_end`).then(data);
// decisions: [{ student_id, outcome }]; others get the recommended outcome.
// Resolves to { outcomes: { Promoted: n, ... }, next_year }
export const applyYearEnd = (base, decisions) => client.post(`${base}/year_end`, { decisions }).then(data);
// { year, results: [{ student_id, name, from_form, to_form, subjects_passed, outcome, can_proceed, ... }] }
export const getYearResults = (base) => client.get(`${base}/year_results`).then(data);
export const allowToProceed = (base, studentId) => client.post(`${base}/year_results/${studentId}/proceed`).then(data);

// MCDE only
export const getPromotionSettings = () => client.get("/admin/promotion_settings").then(data);
// settings: { automatic, subjects_to_pass }
export const savePromotionSettings = (settings) => client.put("/admin/promotion_settings", settings).then(data);
export const listStages = () => client.get("/admin/stages").then(list);
export const advanceAllSchools = (fromTerm) => client.post("/admin/stages/advance_all", { from_term: fromTerm }).then(data);
// Resolves to [{ school_id, outcomes, next_year, error }]
export const runAutomaticPromotion = () => client.post("/admin/year_end/run_automatic").then(list);

// MCDE's access to one school's marks (corrections, including finished years)
// Every learner of a school matching the filters, as an array (as schoolPortal.listAllSchoolStudents)
export const listSchoolStudentsAsAdmin = (schoolId, filters) =>
  client.get(`/admin/schools/${schoolId}/students`, { params: params({ ...filters, page_size: 5000 }) }).then((r) => r.data.students);
export const listSchoolMarksAsAdmin = (schoolId, filters) =>
  client.get(`/admin/schools/${schoolId}/marks`, { params: filters }).then(list);
export const saveSchoolMarksAsAdmin = (schoolId, body) => client.put(`/admin/schools/${schoolId}/marks`, body).then(data);
// A finished year: who was at the school then (form_level is their form that year,
// including learners who have since completed, left or moved) and their marks for
// the term. filters: { academic_year_id, term }. Resolves to { learners, marks }
export const listSchoolYearMarksAsAdmin = (schoolId, filters) =>
  client.get(`/admin/schools/${schoolId}/marks/year`, { params: filters }).then(data);
