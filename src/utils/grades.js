// Grading for per-subject marks (0-100). One scale for marks entry, reports and student views.

export const PASS_MARK = 40;

// tone is a design-system Badge tone (see components/GradeBadge)
const SCALE = [
  { min: 90, grade: "A", tone: "green" },
  { min: 80, grade: "B", tone: "blue" },
  { min: 70, grade: "C", tone: "purple" },
  { min: 60, grade: "D", tone: "amber" },
  { min: PASS_MARK, grade: "E", tone: "slate" },
  { min: 0, grade: "F", tone: "red" },
];

// { grade, tone } for a mark, or a dash when there is no mark
export function gradeFor(mark) {
  if (mark == null || Number.isNaN(mark)) return { grade: "-", tone: "slate" };
  return SCALE.find((step) => mark >= step.min);
}

// Mean of the numbers given, ignoring missing values; null when there are none
export function average(values) {
  const present = values.filter((v) => v != null && !Number.isNaN(v));
  return present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null;
}

export const formatMark = (value) => (value == null ? "-" : Number.isInteger(value) ? String(value) : value.toFixed(1));
