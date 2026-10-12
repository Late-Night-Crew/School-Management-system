// Typed confirmation for dangerous actions (see components/TypeToConfirm). The name is
// compared ignoring case and extra spaces, so typing it is deliberate without being fussy.
const normalise = (text) => (text || "").trim().replace(/\s+/g, " ").toLowerCase();

export const nameMatches = (name, typed) => normalise(typed) !== "" && normalise(typed) === normalise(name);
