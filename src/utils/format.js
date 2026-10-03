// Display formatting shared across pages.

// Date-only values ("YYYY-MM-DD") are read as local dates so they do not shift a day
export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "-";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(undefined, options);
}

export const formatNumber = (value) => (value == null ? "-" : Number(value).toLocaleString());

// Pass rates arrive as numbers (reports) or numeric strings (exam results)
export function formatRate(value) {
  if (value === "" || value == null) return "-";
  const rate = Number(value);
  return Number.isNaN(rate) ? "-" : `${rate.toFixed(1)}%`;
}

export const fullName = (person) => [person?.first_name, person?.last_name].filter(Boolean).join(" ");

// "Chikondi Banda" -> "CB"
export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
