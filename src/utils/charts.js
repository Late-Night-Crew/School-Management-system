// Chart colours and helpers. The four series colours are checked for colour-blind
// separation on white, in this order; assign them by what a series is, never by rank.
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
// For "not recorded" and similar leftovers
export const MUTED = "#94a3b8";
export const GRID = "#e5e7eb";
export const AXIS_TEXT = "#6b7280";

export const GENDER_COLORS = { Male: SERIES[0], Female: SERIES[1], "Not recorded": MUTED };
// Slices sit in this order, so each neighbouring pair (and the wrap-around) stays apart
export const STATUS_COLORS = { Current: SERIES[0], Withdrawn: SERIES[1], "Dropped out": SERIES[2], "Completed Form 4": SERIES[3] };
// Ordered steps of one blue, light to dark: Terms 1, 2 and 3
export const TERM_RAMP = ["#86b6ef", "#2a78d6", "#104281"];
export const STATUS_NAMES = { Active: "Current", Withdrawn: "Withdrawn", DroppedOut: "Dropped out", Completed: "Completed Form 4" };

export const percentOf = (part, total) => (total ? `${Math.round((part / total) * 100)}%` : "0%");
export const pct = (value) => (value == null ? "-" : `${Math.round(value)}%`);
