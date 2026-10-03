import Badge from "./ui/Badge";

// Badge for a transfer's status: Pending, Accepted, Completed or Rejected.
const TONES = { Pending: "amber", Accepted: "blue", Completed: "green", Rejected: "red" };

export default function TransferStatusBadge({ status }) {
  return <Badge tone={TONES[status] || "slate"}>{status}</Badge>;
}
