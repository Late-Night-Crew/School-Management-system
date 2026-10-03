import { Spinner } from "react-bootstrap";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Notice from "./ui/Notice";

// Shows loading, error or empty states for a data-backed section, otherwise its children.
export default function DataState({
  loading,
  error,
  empty = false,
  emptyMessage = "Nothing to show yet.",
  emptyIcon = "bi-inbox",
  onRetry,
  children,
}) {
  if (loading) {
    return (
      <div className="ui-loading">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "0 4px" }}>
        <Notice tone="red">
          <span>{error}</span>
          {onRetry && (
            <Button variant="ghost" size="sm" icon="bi-arrow-clockwise" onClick={onRetry}>
              Try again
            </Button>
          )}
        </Notice>
      </div>
    );
  }
  if (empty) {
    return <EmptyState icon={emptyIcon}>{emptyMessage}</EmptyState>;
  }
  return children;
}
