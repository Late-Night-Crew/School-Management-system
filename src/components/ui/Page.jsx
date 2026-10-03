// Page frame used by every screen: gradient header, optional pill tabs, then content.
//
//   <Page icon="bi-people" title="Students" subtitle="…" stats={[{ label: "Enrolled", value: 12 }]}
//         actions={<Button>Add</Button>} tabs={[{ key, label, icon, count }]} activeTab={tab} onTabChange={setTab}>
//     …cards…
//   </Page>
export default function Page({ icon, title, subtitle, stats = [], actions, tabs, activeTab, onTabChange, children }) {
  return (
    <div className="ui-page">
      <header className="ui-header">
        {icon && (
          <div className="ui-header-icon">
            <i className={`bi ${icon}`} />
          </div>
        )}
        <div>
          <h1 className="ui-header-title">{title}</h1>
          {subtitle && <div className="ui-header-sub">{subtitle}</div>}
        </div>
        {(stats.length > 0 || actions) && (
          <div className="ui-header-end">
            {stats.map((stat) => (
              <div className="ui-header-stat" key={stat.label}>
                <div className="ui-header-stat-value">{stat.value ?? "…"}</div>
                <div className="ui-header-stat-label">{stat.label}</div>
              </div>
            ))}
            {actions}
          </div>
        )}
      </header>

      {tabs && (
        <div className="ui-tabs-bar">
          <div className="ui-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`ui-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.icon && <i className={`bi ${tab.icon}`} />}
                {tab.label}
                {tab.count != null && <span className="ui-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="ui-body">{children}</div>
    </div>
  );
}
