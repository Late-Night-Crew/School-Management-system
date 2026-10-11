import { useCallback, useState } from "react";

import { listInbox, markNoticeDone, markNoticeRead } from "../../api/comms";
import DataState from "../../components/DataState";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import { Badge, Button, Card, Notice, Segmented } from "../../components/ui";
import { DATE_TIME, dueStatus } from "./shared";
import styles from "./Communications.module.css";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "todo", label: "To do" },
];

// Notices sent to the signed-in user's school or regional office. Opening one marks it
// read; a notice with a due date also asks for "Mark as done".
export default function NoticeInbox() {
  const { data, loading, error, reload } = useAsync(useCallback(() => listInbox(), []));
  const notices = data || [];
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [actionError, setActionError] = useState("");

  const active = notices.filter((n) => !n.withdrawn_at);
  const unreadCount = active.filter((n) => !n.read_at).length;
  const todoCount = active.filter((n) => n.due_date && !n.done_at).length;
  const visible = notices.filter((n) => {
    if (filter === "unread") return !n.read_at && !n.withdrawn_at;
    if (filter === "todo") return n.due_date && !n.done_at && !n.withdrawn_at;
    return true;
  });

  const toggle = async (notice) => {
    setOpenId(openId === notice.id ? null : notice.id);
    if (!notice.read_at && !notice.withdrawn_at) {
      try {
        await markNoticeRead(notice.id);
        reload();
      } catch (err) {
        setActionError(err.message);
      }
    }
  };

  const markDone = async (notice) => {
    try {
      await markNoticeDone(notice.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <Card
      accent="blue"
      icon="bi-megaphone"
      title="Notices"
      subtitle="Official notices from the ministry and your regional office, and automatic transfer updates"
      flush
    >
      <div className={styles.pane}>
        <div className={styles.toolbar}>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={FILTERS.map((f) => ({
              ...f,
              label: f.value === "unread" ? `Unread (${unreadCount})` : f.value === "todo" ? `To do (${todoCount})` : f.label,
            }))}
          />
        </div>
        {actionError && <Notice tone="red">{actionError}</Notice>}
      </div>
      <DataState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        empty={visible.length === 0}
        emptyIcon="bi-megaphone"
        emptyMessage={filter === "all" ? "No notices yet." : "Nothing here. You are up to date."}
      >
        <ul className={styles.noticeList}>
          {visible.map((notice) => (
            <NoticeItem
              key={notice.id}
              notice={notice}
              open={openId === notice.id}
              onToggle={() => toggle(notice)}
              onDone={() => markDone(notice)}
            />
          ))}
        </ul>
      </DataState>
    </Card>
  );
}

function NoticeItem({ notice, open, onToggle, onDone }) {
  const system = notice.kind === "SYSTEM";
  const due = dueStatus(notice);
  const classes = [
    styles.notice,
    !notice.read_at && !notice.withdrawn_at ? styles.unread : "",
    notice.priority === "Urgent" && !notice.withdrawn_at ? styles.urgent : "",
    notice.withdrawn_at ? styles.withdrawn : "",
  ].join(" ");

  return (
    <li className={classes}>
      <button type="button" className={styles.noticeHead} onClick={onToggle} aria-expanded={open}>
        <span className={`${styles.dot} ${notice.read_at || notice.withdrawn_at ? styles.dotRead : ""}`} aria-hidden="true" />
        <span className={`${styles.noticeIcon} ui-tone-${system ? "slate" : notice.priority === "Urgent" ? "red" : "blue"}`} aria-hidden="true">
          <i className={`bi ${system ? "bi-arrow-left-right" : "bi-megaphone"}`} />
        </span>
        <span>
          <span className={styles.noticeTitle}>{notice.title}</span>
          <span className={styles.muted} style={{ display: "block" }}>
            {notice.sender_label}
            {notice.sender_name && !system ? ` · ${notice.sender_name}` : ""} · {formatDate(notice.created_at, DATE_TIME)}
          </span>
        </span>
        <span className={styles.noticeMeta}>
          {notice.withdrawn_at && <Badge tone="slate">Withdrawn</Badge>}
          {notice.priority === "Urgent" && !notice.withdrawn_at && <Badge tone="red">Urgent</Badge>}
          {due && !notice.withdrawn_at && <Badge tone={due.tone}>{due.label}</Badge>}
        </span>
      </button>
      {open && (
        <div className={styles.noticeBody}>
          {notice.withdrawn_at && (
            <Notice tone="amber">
              Withdrawn by the sender on {formatDate(notice.withdrawn_at)}: {notice.withdrawn_reason}
            </Notice>
          )}
          <p className={styles.bodyText}>{notice.body}</p>
          <div className={styles.bodyActions}>
            {notice.due_date && !notice.done_at && !notice.withdrawn_at && (
              <Button size="sm" variant="success" icon="bi-check2-circle" onClick={onDone}>
                Mark as done
              </Button>
            )}
            {notice.done_at && (
              <span className={styles.muted}>
                <i className="bi bi-check2-circle" /> Marked done
                {notice.done_by_name ? ` by ${notice.done_by_name}` : ""} on {formatDate(notice.done_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
