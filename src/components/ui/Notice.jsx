// Inline message box. tone: blue (info) | green | amber (warning) | red (error)
const ICONS = { blue: "bi-info-circle-fill", green: "bi-check-circle-fill", amber: "bi-exclamation-triangle-fill", red: "bi-x-octagon-fill" };

export default function Notice({ tone = "blue", icon, children }) {
  return (
    <div className={`ui-notice ui-tone-${tone}`} role={tone === "red" ? "alert" : "status"}>
      <i className={`bi ${icon || ICONS[tone]}`} />
      {children}
    </div>
  );
}
