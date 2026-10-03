// Table styled like the Student Enrollment list. Put it inside <Card flush>.
// Cell helpers: className "num" (right-aligned mono), "center", "end" (actions), "strong", "nowrap".
// `nowrap` keeps every cell on one line (the table scrolls sideways instead).
export default function Table({ compact = false, nowrap = false, className = "", children, ...props }) {
  const classes = ["ui-table", compact && "ui-table-compact", nowrap && "ui-table-nowrap", className].filter(Boolean).join(" ");
  return (
    <div className="ui-table-wrap">
      <table className={classes} {...props}>
        {children}
      </table>
    </div>
  );
}
