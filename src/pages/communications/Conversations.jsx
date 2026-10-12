import { useCallback, useEffect, useRef, useState } from "react";

import {
  getConversation,
  listContacts,
  listConversations,
  reportConversation,
  sendMessage,
  startConversation,
} from "../../api/comms";
import { ROLE_LABELS } from "../../auth/session";
import DataState from "../../components/DataState";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../utils/format";
import { Badge, Button, Card, Dialog, Field, Input, Notice, Select, Textarea } from "../../components/ui";
import { DATA_PROTECTION_HINT, DATE_TIME, PRIVACY_NOTE } from "./shared";
import styles from "./Communications.module.css";

const MAX_LENGTH = 5000;

// The signed-in user's conversations: the list on the left, the open thread on the right.
// openId is controlled by the page so "New message" can open the thread it creates.
export default function Conversations({ openId, onOpen, refreshKey }) {
  const { data, loading, error, reload } = useAsync(
    // refreshKey reloads the list after a new conversation is started
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => listConversations(), [refreshKey])
  );
  const conversations = data || [];

  return (
    <Card accent="purple" icon="bi-chat-left-text" title="Messages" subtitle={PRIVACY_NOTE} flush>
      {/* Only the first load shows the spinner; later reloads keep the open thread mounted */}
      <DataState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        empty={conversations.length === 0}
        emptyIcon="bi-chat-left-text"
        emptyMessage="No conversations yet. Use New message to contact the ministry, a regional office or a school."
      >
        <div className={`${styles.messenger} ${openId ? styles.hasOpen : styles.noOpen}`}>
          <ul className={styles.threadList}>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`${styles.threadItem} ${c.unread ? styles.threadUnread : ""} ${c.id === openId ? styles.threadActive : ""}`}
                  onClick={() => onOpen(c.id)}
                  aria-current={c.id === openId ? "true" : undefined}
                >
                  <div className={styles.threadTop}>
                    <span className={styles.threadWith}>{c.with.label}</span>
                    <span>{formatDate(c.last_message_at, { day: "numeric", month: "short" })}</span>
                  </div>
                  <div className={styles.threadSubject}>
                    {c.unread && <span className="visually-hidden">Unread: </span>}
                    {c.subject}
                  </div>
                  <div className={styles.threadPreview}>
                    {c.last_from_me ? "You: " : ""}
                    {c.last_body}
                  </div>
                  {(c.unread || c.reported) && (
                    <div style={{ marginTop: 4, display: "flex", gap: 6 }}>
                      {c.unread && <Badge tone="blue">New</Badge>}
                      {c.reported && <Badge tone="red">Reported</Badge>}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.thread}>
            {openId ? (
              <ConversationThread id={openId} onBack={() => onOpen(null)} onChanged={reload} />
            ) : (
              <div className={styles.pane}>
                <p className={styles.muted}>Choose a conversation to read it.</p>
              </div>
            )}
          </div>
        </div>
      </DataState>
    </Card>
  );
}

// One conversation with its messages and a reply box. Read-only when the super admin is
// reviewing a reported conversation they are not part of.
export function ConversationThread({ id, onBack, onChanged }) {
  const { data: thread, loading, error, reload } = useAsync(useCallback(() => getConversation(id), [id]));
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [reporting, setReporting] = useState(false);
  const endRef = useRef(null);

  // Opening a thread marks it read, so refresh the list's unread markers
  useEffect(() => {
    if (thread) onChanged?.();
  }, [thread, onChanged]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setSendError("");
    try {
      await sendMessage(id, reply.trim());
      setReply("");
      reload();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const other = thread?.participants.map((p) => p.label).join(" and ");

  return (
    <DataState loading={loading && !thread} error={error} onRetry={reload}>
      {thread && (
        <>
          <div className={styles.threadHead}>
            <div style={{ minWidth: 0 }}>
              {onBack && (
                <Button variant="ghost" size="sm" icon="bi-arrow-left" className={styles.backLink} onClick={onBack}>
                  All messages
                </Button>
              )}
              <h3 className={styles.threadTitle}>{thread.subject}</h3>
              <div className={styles.muted}>{other}</div>
            </div>
            {!thread.read_only && !thread.reported_at && (
              <Button variant="ghost" size="sm" icon="bi-flag" onClick={() => setReporting(true)} title="Report this conversation to the ministry">
                Report
              </Button>
            )}
          </div>

          {thread.reported_at && (
            <div className={styles.pane} style={{ paddingBottom: 0 }}>
              <Notice tone="amber">
                Reported by {thread.reported_by_name || "a participant"} on {formatDate(thread.reported_at)}: {thread.report_reason}.{" "}
                {thread.read_only ? "You are reviewing it as the Learner Support Manager." : "The ministry can now read this conversation."}
              </Notice>
            </div>
          )}

          <div className={styles.messages} aria-live="polite">
            {thread.messages.map((m) => (
              <div key={m.id} className={`${styles.bubble} ${m.from_me ? styles.mine : ""}`}>
                <div className={styles.bubbleFrom}>
                  {m.from_me ? "You" : m.sender_name || "Unknown"} · {m.from.label}
                  {m.sender_role && !m.from_me ? ` (${ROLE_LABELS[m.sender_role] || m.sender_role})` : ""}
                </div>
                <div className={styles.bubbleText}>{m.body}</div>
                <div className={styles.bubbleTime}>{formatDate(m.created_at, DATE_TIME)}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {!thread.read_only && (
            <form className={styles.reply} onSubmit={handleSend}>
              {sendError && <Notice tone="red">{sendError}</Notice>}
              <Textarea
                rows={3}
                value={reply}
                maxLength={MAX_LENGTH}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(e);
                }}
                placeholder="Write a reply… (Ctrl+Enter to send)"
                aria-label="Reply"
              />
              <div className={styles.replyFoot}>
                <span className={styles.muted}>{DATA_PROTECTION_HINT}</span>
                <Button type="submit" icon="bi-send" disabled={sending || !reply.trim()}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </form>
          )}

          {reporting && (
            <ReportDialog
              conversationId={id}
              onHide={() => setReporting(false)}
              onDone={() => {
                setReporting(false);
                reload();
              }}
            />
          )}
        </>
      )}
    </DataState>
  );
}

function ReportDialog({ conversationId, onHide, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await reportConversation(conversationId, reason.trim());
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title="Report Conversation"
      icon="bi-flag"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon="bi-flag" disabled={saving || !reason.trim()}>
            {saving ? "Reporting…" : "Report"}
          </Button>
        </>
      }
    >
      <p className={styles.explain}>
        Reporting lets the Learner Support Manager read this whole conversation so they can deal with misuse. Both sides
        will see that it was reported. This cannot be undone.
      </p>
      {error && <Notice tone="red">{error}</Notice>}
      <Field label="What is wrong?" required>
        <Textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Abusive language, or sharing student details that should not be shared"
          autoFocus
        />
      </Field>
    </Dialog>
  );
}

// Starts a conversation with anyone the user is allowed to contact.
export function NewMessageDialog({ onHide, onStarted }) {
  const { data: contacts = [], loading, error: loadError } = useAsync(useCallback(() => listContacts(), []));
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // <optgroup> per group, in the order the server returns them
  const groups = contacts.reduce((acc, contact) => {
    (acc[contact.group] ||= []).push(contact);
    return acc;
  }, {});
  const valid = to && subject.trim() && body.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    const [toType, toId] = to.split(":");
    setSaving(true);
    setError("");
    try {
      const conversation = await startConversation({
        to_type: toType,
        to_id: Number(toId),
        subject: subject.trim(),
        body: body.trim(),
      });
      onStarted(conversation.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title="New Message"
      icon="bi-chat-left-text"
      size="lg"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" icon="bi-send" disabled={saving || !valid}>
            {saving ? "Sending…" : "Send"}
          </Button>
        </>
      }
    >
      <Notice tone="blue">{PRIVACY_NOTE}</Notice>
      {(error || loadError) && <Notice tone="red">{error || loadError}</Notice>}
      <div className="ui-grid" style={{ marginTop: 14 }}>
        <Field label="To" required hint={loading ? "Loading contacts…" : null}>
          <Select value={to} onChange={(e) => setTo(e.target.value)} required disabled={loading}>
            <option value="">Choose who to contact…</option>
            {Object.entries(groups).map(([group, members]) => (
              <optgroup key={group} label={group}>
                {members.map((c) => (
                  <option key={`${c.type}:${c.id}`} value={`${c.type}:${c.id}`}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Subject" required>
          <Input value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} placeholder="What is this about?" />
        </Field>
        <Field label="Message" required hint={DATA_PROTECTION_HINT}>
          <Textarea rows={6} value={body} maxLength={MAX_LENGTH} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
