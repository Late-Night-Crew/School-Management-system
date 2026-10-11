import { useCallback, useState } from "react";

import { listReportedConversations } from "../../api/comms";
import DataState from "../../components/DataState";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import { Button, Card, Dialog, Table } from "../../components/ui";
import { ConversationThread } from "./Conversations";
import styles from "./Communications.module.css";

// Conversations a participant reported. Only these can be read by the super admin
// without being part of them, and only read: the super admin cannot post into them.
export default function ReportedConversations() {
  const { data: reported = [], loading, error, reload } = useAsync(useCallback(() => listReportedConversations(), []));
  const [openId, setOpenId] = useState(null);

  return (
    <Card
      accent="red"
      icon="bi-flag"
      title="Reported Conversations"
      subtitle="Conversations stay private unless one side reports them. You can read reported ones, but not reply in them."
      flush
    >
      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={reported.length === 0}
        emptyIcon="bi-flag"
        emptyMessage="No conversations have been reported."
      >
        <Table>
          <thead>
            <tr>
              <th>Conversation</th>
              <th>Between</th>
              <th>Reported</th>
              <th>Reason</th>
              <th className="end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reported.map((c) => (
              <tr key={c.id}>
                <td className="strong">{c.subject}</td>
                <td>
                  {c.participants.map((p) => (
                    <div key={`${p.type}:${p.id}`}>{p.label}</div>
                  ))}
                </td>
                <td>
                  <div>{formatDate(c.reported_at)}</div>
                  {c.reported_by_name && <div className={styles.muted}>by {c.reported_by_name}</div>}
                </td>
                <td>{c.report_reason}</td>
                <td className="end">
                  <Button variant="ghost" size="sm" icon="bi-eye" onClick={() => setOpenId(c.id)}>
                    Read
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataState>

      {openId && (
        <Dialog show onHide={() => setOpenId(null)} title="Reported Conversation" icon="bi-flag" size="lg">
          <ConversationThread id={openId} />
        </Dialog>
      )}
    </Card>
  );
}
