// The grading scale for subject marks. Every role reads it; only super admins change it.
import client, { data } from "./client";

// { bands: [{ id, grade, min_mark, max_mark, is_pass, description }], pass_mark, updated_at }
export const getGradingScale = () => client.get("/admin/grading_scale").then(data);
// bands: [{ grade, min_mark, is_pass, description }], in any order. Replaces the whole scale.
export const saveGradingScale = (bands) => client.put("/admin/grading_scale", { bands }).then(data);
