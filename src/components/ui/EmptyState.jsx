export default function EmptyState({ icon = "bi-inbox", title, children }) {
  return (
    <div className="ui-empty">
      <i className={`bi ${icon}`} />
      {title && <div className="ui-empty-title">{title}</div>}
      {children && <div className="ui-empty-text">{children}</div>}
    </div>
  );
}
