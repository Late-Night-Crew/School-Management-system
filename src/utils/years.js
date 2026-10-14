// Academic years that can hold records: the active year and past years. Upcoming years
// are never offered for marks, learners or reports (the server refuses them too).
// A year's status follows its dates; the date is checked too in case it is a day stale.
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

export const startedYears = (years = []) =>
  years.filter((y) => y.status !== "Upcoming" || (y.start_date && y.start_date.slice(0, 10) <= today()));
