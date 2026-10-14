// Labels for year-end outcomes (see backend schema/promotion.go)
export const OUTCOMES = {
  Promoted: { label: "Moves up", tone: "green" },
  Proceeded: { label: "Allowed to move up", tone: "blue" },
  Repeat: { label: "Repeats the form", tone: "amber" },
  Completed: { label: "Completed Form 4", tone: "purple" },
  Rewrite: { label: "Rewrites Form 4", tone: "red" },
};

export const outcomeLabel = (outcome) => OUTCOMES[outcome]?.label || outcome;
