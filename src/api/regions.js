// Regions (shown as "divisions" in the admin UI). Reads are open to every role;
// changes are super-admin only.
import client, { data, list } from "./client";

export const listRegions = () => client.get("/admin/regions").then(list);
export const getRegion = (id) => client.get(`/admin/regions/${id}`).then(data);
export const createRegion = (region) => client.post("/admin/regions", region).then(data);
export const updateRegion = (id, region) => client.put(`/admin/regions/${id}`, region).then(data);
export const deleteRegion = (id) => client.delete(`/admin/regions/${id}`).then(data);

// { districts, schools, active_accounts, can_delete }. A division can only be deleted once empty.
export const getRegionUsage = (id) => client.get(`/admin/regions/${id}/usage`).then(data);
// Moves every district in the division (with their schools) to another. Returns { moved }.
export const moveRegionDistricts = (id, toRegionId) =>
  client.post(`/admin/regions/${id}/move_districts`, { to_region_id: toRegionId }).then(data);
