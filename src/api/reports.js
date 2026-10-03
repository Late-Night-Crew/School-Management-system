// National reports (super admin). Regional admins use regionPortal.listRegionSchools.
import client, { list, params } from "./client";

// One row per school with enrolment, transfer and pass-rate figures.
// filters: { region_id, district_id, academic_year_id (year of the pass rates) }
export const getSchoolReport = (filters) =>
  client.get("/admin/reports/schools", { params: params(filters) }).then(list);
