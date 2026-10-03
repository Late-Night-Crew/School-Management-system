// A label/value row for read-only detail cards.
export default function DetailRow({ label, value }) {
  return (
    <div className="ui-detail">
      <div className="ui-detail-label">{label}</div>
      <div className="ui-detail-value">{value || "-"}</div>
    </div>
  );
}
