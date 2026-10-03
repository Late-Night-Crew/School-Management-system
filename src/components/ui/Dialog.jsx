import { Modal } from "react-bootstrap";

// Modal with the gradient title bar. Wrap the content in a <form> yourself if needed
// (pass `as="form"` with onSubmit to make the whole dialog a form).
export default function Dialog({ show, onHide, title, icon, size, footer, as, onSubmit, children }) {
  const Wrapper = as === "form" ? "form" : "div";
  return (
    <Modal show={show} onHide={onHide} centered scrollable size={size} dialogClassName="ui-modal">
      <Wrapper onSubmit={onSubmit} style={{ display: "contents" }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {icon && <i className={`bi ${icon}`} />}
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        {footer && <Modal.Footer>{footer}</Modal.Footer>}
      </Wrapper>
    </Modal>
  );
}
