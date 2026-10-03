import { Link } from "react-router-dom";

// Pill button. variant: primary | ghost | danger | success. Pass `to` to render a router link.
export default function Button({ variant = "primary", size, icon, to, type = "button", className = "", children, ...props }) {
  const classes = `ui-btn ui-btn-${variant} ${size === "sm" ? "ui-btn-sm" : ""} ${className}`;
  const content = (
    <>
      {icon && <i className={`bi ${icon}`} />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}

const ICONS = { view: "bi-eye", edit: "bi-pencil", delete: "bi-trash", save: "bi-save" };

// Square icon button for table rows. kind: view | edit | delete | save (sets icon and hover colour).
// `title` is required: it is the button's accessible name.
export function IconButton({ kind = "view", icon, title, to, ...props }) {
  const classes = `ui-icon-btn ${kind}`;
  const glyph = <i className={`bi ${icon || ICONS[kind]}`} />;
  if (to) {
    return (
      <Link to={to} className={classes} title={title} aria-label={title} {...props}>
        {glyph}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} title={title} aria-label={title} {...props}>
      {glyph}
    </button>
  );
}
