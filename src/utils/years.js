// Academic years that can hold records: the active year and past years. Upcoming years
// are never offered for marks, learners or reports (the server refuses them too).
export const startedYears = (years = []) => years.filter((y) => y.status !== "Upcoming");
