// Status choices for the learner lists (the `status` filter of the paged lists).
export const LEARNER_SHOWS = [
  { value: "Active", label: "Current" },
  { value: "Left", label: "Left" },
  { value: "Completed", label: "Completed" },
  { value: "", label: "All" },
];
export const FORMS = [1, 2, 3, 4];

// Rows for a spreadsheet download of learners
export const learnerSheetRows = (students) =>
  students.map((s) => ({
    "Student Number": s.student_number,
    "First Name": s.first_name,
    "Last Name": s.last_name,
    Gender: s.gender,
    Form: s.form_level || "",
    School: s.school_name,
    District: s.district_name,
    Division: s.region_name,
    Status: s.status,
    "Left On": s.left_on || "",
    "National ID": s.national_id,
  }));
