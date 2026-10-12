import { OverlayTrigger, Tooltip } from "react-bootstrap";

// Styled tooltip shown on hover and keyboard focus. The child must accept a ref and
// mouse/focus handlers (a DOM element or a component that forwards them).
//
//   <Tip text="Close this school"><button …/></Tip>
export default function Tip({ text, placement = "top", children }) {
  if (!text) return children;
  return (
    <OverlayTrigger
      placement={placement}
      delay={{ show: 250, hide: 0 }}
      overlay={(props) => (
        <Tooltip {...props} className="ui-tooltip">
          {text}
        </Tooltip>
      )}
    >
      {children}
    </OverlayTrigger>
  );
}
