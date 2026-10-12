import { Link } from "react-router-dom";
import Tip from "./Tip";

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
// `title` is required: it is the button's accessible name and is shown as a tooltip.
// `tip` replaces the tooltip text when the row already says what the button acts on.
export function IconButton({ kind = "view", icon, title, tip, to, ...props }) {
  const classes = `ui-icon-btn ${kind}`;
  const glyph = <i className={`bi ${icon || ICONS[kind]}`} aria-hidden="true" />;
  if (to) {
    return (
      <Tip text={tip || title}>
        <Link to={to} className={classes} aria-label={title} {...props}>
          {glyph}
        </Link>
      </Tip>
    );
  }
  return (
    <Tip text={tip || title}>
      <button type="button" className={classes} aria-label={title} {...props}>
        {glyph}
      </button>
    </Tip>
  );
}
