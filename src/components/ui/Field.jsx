// Labelled form controls styled like the Student Enrollment form.

export function Field({ label, required, hint, error, children, className = "" }) {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label className="ui-label">
          {label}
          {required && " *"}
        </label>
      )}
      {children}
      {error ? <div className="ui-error">{error}</div> : hint && <div className="ui-hint">{hint}</div>}
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`ui-input ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`ui-textarea ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <div className="ui-select-wrap">
      <select className={`ui-select ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="ui-search">
      <i className="bi bi-search" />
      <input
        className="ui-input"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// On/off toggle, e.g. "Student has a disability"
export function Switch({ checked, onChange, children }) {
  return (
    <label className={`ui-switch ${checked ? "on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="ui-switch-track" />
      {children}
    </label>
  );
}

// Small set of mutually exclusive buttons, e.g. Term 1 / 2 / 3.
// options: [{ value, label, disabled, title }]
export function Segmented({ options, value, onChange }) {
  return (
    <div className="ui-segmented" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? "active" : ""}
          aria-pressed={option.value === value}
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
