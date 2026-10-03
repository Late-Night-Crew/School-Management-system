// Read-only endpoints for a regional admin, scoped to their own region (/region/:regionId).
import client, { data, list, params } from "./client";

const base = (regionId) => `/region/${regionId}`;

export const getRegionDashboard = (regionId) => client.get(`${base(regionId)}/dashboard`).then(data);

// Districts with their school and student counts
export const listRegionDistricts = (regionId) => client.get(`${base(regionId)}/districts`).then(list);

// School report rows; filters: { district_id, academic_year_id (year of the pass rates) }
export const listRegionSchools = (regionId, filters) =>
  client.get(`${base(regionId)}/schools`, { params: params(filters) }).then(list);

// filters: { district_id, school_id }
export const listRegionStudents = (regionId, filters) =>
  client.get(`${base(regionId)}/students`, { params: params(filters) }).then(list);

// Transfers into or out of any school in the region
export const listRegionTransfers = (regionId) => client.get(`${base(regionId)}/transfers`).then(list);
