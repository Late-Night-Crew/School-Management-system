// Districts. Reads are open to every role; changes are super-admin only.
import client, { data, list } from "./client";

export const listDistricts = () => client.get("/admin/districts").then(list);
export const createDistrict = (district) => client.post("/admin/districts", district).then(data);
export const updateDistrict = (id, district) => client.put(`/admin/districts/${id}`, district).then(data);
export const deleteDistrict = (id) => client.delete(`/admin/districts/${id}`).then(data);

// { schools, active_accounts, can_delete }. A district can only be deleted once empty.
export const getDistrictUsage = (id) => client.get(`/admin/districts/${id}/usage`).then(data);
// Moves every school in the district to another district. Returns { moved }.
export const moveDistrictSchools = (id, toDistrictId) =>
  client.post(`/admin/districts/${id}/move_schools`, { to_district_id: toDistrictId }).then(data);
