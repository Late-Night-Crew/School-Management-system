import { initials } from "../../utils/format";

// Avatar initials with a name and an optional second line, for table cells and lists.
export default function Person({ name, sub }) {
  return (
    <div className="ui-person">
      <span className="ui-avatar" aria-hidden="true">{initials(name) || "?"}</span>
      <div>
        <div className="ui-person-name">{name}</div>
        {sub && <div className="ui-person-sub">{sub}</div>}
      </div>
    </div>
  );
}
