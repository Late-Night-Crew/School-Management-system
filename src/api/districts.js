// Districts. Reads are open to every role; changes are super-admin only.
import client, { data, list } from "./client";

export const listDistricts = () => client.get("/admin/districts").then(list);
export const createDistrict = (district) => client.post("/admin/districts", district).then(data);
export const updateDistrict = (id, district) => client.put(`/admin/districts/${id}`, district).then(data);
export const deleteDistrict = (id) => client.delete(`/admin/districts/${id}`).then(data);
