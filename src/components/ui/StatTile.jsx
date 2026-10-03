// Summary number with a coloured icon, as on the Academic Year page.
// tone: blue | green | amber | red | purple | slate. Lay several out with
// <div className="ui-grid ui-cols-4">.
export default function StatTile({ label, value, icon, tone = "blue", detail, loading = false }) {
  return (
    <div className="ui-stat">
      {icon && (
        <div className={`ui-stat-icon ui-tone-${tone}`}>
          <i className={`bi ${icon}`} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="ui-stat-value">{loading ? "…" : value}</div>
        <div className="ui-stat-label">{label}</div>
        {detail && !loading && <div className="ui-stat-detail">{detail}</div>}
      </div>
    </div>
  );
}
