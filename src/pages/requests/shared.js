// Labels and helpers shared by the school request screens and the PDF copy.
import { ROLES } from "../../auth/session";

// Where a role's school request pages live
export function requestsBase(session) {
  return session.role === ROLES.SUPER_ADMIN ? "/admin/school-requests" : `/regional/${session.regionId}/school-requests`;
}

export const LOCATIONS = [
  { value: "URBAN", label: "Urban" },
  { value: "SEMI_URBAN", label: "Semi-urban" },
  { value: "RURAL", label: "Rural" },
  { value: "REMOTE", label: "Remote" },
];

export const VENUES = [
  { value: "HOST_SCHOOL", label: "At the host school" },
  { value: "PRIMARY_SCHOOL", label: "Nearest primary school" },
  { value: "RENTED", label: "Rented private premises" },
  { value: "OTHER", label: "Other" },
];

export const STATUS_TONES = { Draft: "slate", Submitted: "amber", Accepted: "green" };

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label || "";

export const FORMS = ["form1", "form2", "form3", "form4"];

// A blank form; the server returns the same shape
export const emptyForm = () => ({
  school_name: "",
  district_id: 0,
  location: "",
  address: "",
  head_teacher: { name: "", phone: "", email: "" },
  venue_type: "",
  venue_name: "",
  facilitators: [{ name: "", qualification: "", subject_combination: "" }],
  coordinator: { name: "", qualifications: "", email: "", phone: "" },
  enrolment: { form1: null, form2: null, form3: null, form4: null },
  distance_km: null,
  pta_members: [""],
});

// Fills gaps in a form from the server so every input has a value
export function withDefaults(form) {
  const blank = emptyForm();
  const merged = { ...blank, ...form };
  for (const key of ["head_teacher", "coordinator", "enrolment"]) {
    merged[key] = { ...blank[key], ...(form?.[key] || {}) };
  }
  merged.facilitators = form?.facilitators?.length ? form.facilitators : blank.facilitators;
  merged.pta_members = form?.pta_members?.length ? form.pta_members : blank.pta_members;
  return merged;
}

export const totalEnrolment = (enrolment) =>
  FORMS.reduce((sum, key) => sum + (Number(enrolment?.[key]) || 0), 0);
