import Button from "./ui/Button";
import Dialog from "./ui/Dialog";

// Yes/no confirmation. `confirmLabel` defaults to "Confirm"; `danger` styles it red.
export default function ConfirmModal({ show, onHide, onConfirm, title, body, confirmLabel = "Confirm", danger = true }) {
  return (
    <Dialog
      show={show}
      onHide={onHide}
      title={title || "Confirm Action"}
      icon={danger ? "bi-exclamation-triangle" : "bi-question-circle"}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
        {body || "Are you sure?"}
      </p>
    </Dialog>
  );
}
