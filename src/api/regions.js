// Regions (shown as "divisions" in the admin UI). Reads are open to every role;
// changes are super-admin only.
import client, { data, list } from "./client";

export const listRegions = () => client.get("/admin/regions").then(list);
export const getRegion = (id) => client.get(`/admin/regions/${id}`).then(data);
export const createRegion = (region) => client.post("/admin/regions", region).then(data);
export const updateRegion = (id, region) => client.put(`/admin/regions/${id}`, region).then(data);
export const deleteRegion = (id) => client.delete(`/admin/regions/${id}`).then(data);
