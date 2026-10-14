// Figures behind the dashboards' charts: the whole country (MCDE), one division or one
// school. See schema/insights.go for the shape.
import client, { data } from "./client";

export const getNationalInsights = () => client.get("/admin/insights").then(data);
export const getRegionInsights = (regionId) => client.get(`/region/${regionId}/insights`).then(data);
export const getSchoolInsights = (schoolId) => client.get(`/school/${schoolId}/insights`).then(data);
