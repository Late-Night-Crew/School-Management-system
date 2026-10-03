// White section card with a coloured accent edge.
// accent: blue | green | amber | red | purple | slate. `flush` removes body padding
// (use it around tables so they run edge to edge).
export default function Card({ accent = "blue", icon, title, subtitle, actions, footer, flush = false, children }) {
  const hasHead = icon || title || actions;
  return (
    <section className={`ui-card ui-accent-${accent}`}>
      {hasHead && (
        <div className="ui-card-head">
          <div className="ui-card-title-row">
            {icon && (
              <div className={`ui-card-icon ui-tone-${accent}`}>
                <i className={`bi ${icon}`} />
              </div>
            )}
            <div>
              {title && <h2 className="ui-card-title">{title}</h2>}
              {subtitle && <div className="ui-card-sub">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="ui-card-actions">{actions}</div>}
        </div>
      )}
      <div className={`ui-card-body ${flush ? "flush" : ""}`}>{children}</div>
      {footer && <div className="ui-card-foot">{footer}</div>}
    </section>
  );
}
