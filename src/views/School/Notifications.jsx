import React, { useState, useRef, useEffect } from "react";
import ToastNote from "../../components/ToastNote";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "message",
    title: "Admin Update",
    message:
      "The academic calendar for Term 3 has been finalized. Please review the attached PDF for specific dates and any schedule adjustments across all departments.",
    sender: "Regional HQ",
    avatar: "RH",
    time: "10 min ago",
    read: false,
    replies: [
      {
        id: 101,
        sender: "Me",
        text: "Received. I will check the PDF immediately and circulate to staff.",
        time: "5 min ago",
        files: null,
      },
    ],
  },
  {
    id: 2,
    type: "message",
    title: "Facility Inspection Notice",
    message:
      "Regarding the upcoming facility inspection — please ensure all departments are prepared. I have attached the inspection checklist below.",
    sender: "Regional Inspector",
    avatar: "RI",
    time: "2 hrs ago",
    read: false,
    replies: [
      {
        id: 102,
        sender: "Regional Inspector",
        text: "Here are the documents you requested for the inspection.",
        time: "2 hrs ago",
        files: [
          {
            id: "f-102",
            name: "Inspection_Checklist_Term3.xlsx",
            size: 24500,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    type: "alert",
    title: "Attendance Warning — Class 8A",
    message:
      "Class 8A attendance dropped below 85% this week. Immediate action is required. Attached is the detailed attendance breakdown report.",
    sender: "System Monitor",
    avatar: "SM",
    time: "5 hrs ago",
    read: true,
    replies: [],
  },
  {
    id: 4,
    type: "transfer",
    title: "Transfer Request Approved",
    message:
      "The transfer request for John Doe to Capital High School has been successfully processed and recorded in the system.",
    sender: "System Admin",
    avatar: "SA",
    time: "Yesterday",
    read: true,
    replies: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getFileIcon(type = "", name = "") {
  if (type.includes("image")) return "bi-file-image-fill";
  if (type.includes("pdf") || name.endsWith(".pdf")) return "bi-file-pdf-fill";
  if (name.match(/\.(xls|xlsx|csv)$/i)) return "bi-file-excel-fill";
  if (name.match(/\.(doc|docx)$/i)) return "bi-file-word-fill";
  if (name.match(/\.(zip|rar|7z)$/i)) return "bi-file-zip-fill";
  return "bi-file-earmark-fill";
}

function formatBytes(bytes = 0) {
  if (!+bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function typeConfig(type) {
  switch (type) {
    case "message":
      return { icon: "bi-envelope-fill", cls: "nxp-icon--msg", label: "Message" };
    case "alert":
      return { icon: "bi-exclamation-triangle-fill", cls: "nxp-icon--alert", label: "Alert" };
    case "transfer":
      return { icon: "bi-arrow-left-right", cls: "nxp-icon--transfer", label: "Transfer" };
    default:
      return { icon: "bi-bell-fill", cls: "nxp-icon--msg", label: "Notice" };
  }
}

// ─── FILE CHIP ────────────────────────────────────────────────────────────────
function NxpFileChip({ file, downloadingFiles, onDownload }) {
  const loading = downloadingFiles.has(file.id);
  return (
    <div className="nxp-filechip">
      <div className="nxp-filechip__icon">
        <i className={`bi ${getFileIcon(file.type, file.name)}`}></i>
      </div>
      <div className="nxp-filechip__info">
        <span className="nxp-filechip__name" title={file.name}>{file.name}</span>
        <span className="nxp-filechip__size">{formatBytes(file.size)}</span>
      </div>
      <button
        className={`nxp-filechip__dl${loading ? " nxp-filechip__dl--spin" : ""}`}
        onClick={() => !loading && onDownload(file.id)}
        title="Download"
      >
        <i className={`bi ${loading ? "bi-arrow-repeat nxp-spin" : "bi-download"}`}></i>
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SchoolNotifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const selectedNotif = notifications.find((n) => n.id === selectedId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const visibleNotifs = notifications.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !n.read;
    return n.type === filterType;
  });

  // Auto-scroll to bottom on new reply
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedNotif?.replies?.length]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [replyText]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const openNotif = (id) => {
    setSelectedId(id);
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const closeThread = () => {
    setSelectedId(null);
    setReplyText("");
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) setSelectedFiles((p) => [...p, ...Array.from(e.target.files)]);
  };

  const removeFile = (i) => setSelectedFiles((p) => p.filter((_, idx) => idx !== i));

  const handleDownload = (fileId) => {
    setDownloadingFiles((p) => new Set(p).add(fileId));
    setTimeout(() => {
      setDownloadingFiles((p) => { const s = new Set(p); s.delete(fileId); return s; });
      setToast({ show: true, message: "File downloaded!", variant: "success" });
    }, 2000);
  };

  const markAllRead = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));

  const sendReply = () => {
    if (!replyText.trim() && selectedFiles.length === 0) {
      setToast({ show: true, message: "Please type a message or attach a file.", variant: "warning" });
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newReply = {
        id: Date.now(),
        sender: "Me",
        text: replyText,
        time: "Just now",
        files: selectedFiles.length > 0
          ? selectedFiles.map((f) => ({ id: `f-${Date.now()}-${Math.random()}`, name: f.name, size: f.size, type: f.type }))
          : null,
      };
      setNotifications((p) =>
        p.map((n) => n.id === selectedId ? { ...n, replies: [...(n.replies || []), newReply] } : n)
      );
      setReplyText("");
      setSelectedFiles([]);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setToast({ show: true, message: "Reply sent!", variant: "success" });
    }, 1500);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const canSend = (replyText.trim() || selectedFiles.length > 0) && !isUploading;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastNote
        show={toast.show}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        message={toast.message}
        variant={toast.variant}
      />

      <div className={`nxp-shell${selectedId ? " nxp-shell--open" : ""}`}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="nxp-topbar">
          <div className="nxp-topbar__brand">
            <div className="nxp-topbar__logobox">
              <i className="bi bi-bell-fill"></i>
              {unreadCount > 0 && <span className="nxp-topbar__ping"></span>}
            </div>
            <div>
              <h1 className="nxp-topbar__title">Notifications</h1>
              <p className="nxp-topbar__sub">School communication hub</p>
            </div>
          </div>

          <div className="nxp-topbar__right">
            {unreadCount > 0 && (
              <span className="nxp-badge">{unreadCount} unread</span>
            )}
            {unreadCount > 0 && (
              <button className="nxp-ghost-btn" onClick={markAllRead}>
                <i className="bi bi-check2-all"></i>
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </header>

        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <nav className="nxp-filterbar">
          {[
            { key: "all",      icon: "bi-grid-fill",                  label: "All" },
            { key: "unread",   icon: "bi-record-circle-fill",         label: "Unread" },
            { key: "message",  icon: "bi-envelope-fill",              label: "Messages" },
            { key: "alert",    icon: "bi-exclamation-triangle-fill",  label: "Alerts" },
            { key: "transfer", icon: "bi-arrow-left-right",           label: "Transfers" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`nxp-filtertab${filterType === key ? " nxp-filtertab--active" : ""}`}
              onClick={() => setFilterType(key)}
            >
              <i className={`bi ${icon}`}></i>
              <span>{label}</span>
              {key === "unread" && unreadCount > 0 && (
                <span className="nxp-filtertab__badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
        <div className="nxp-canvas">

          {/* ── LEFT PANEL: LIST ────────────────────────────────────────── */}
          <aside className="nxp-listpanel">
            <div className="nxp-listpanel__scroll">

              {visibleNotifs.length === 0 && (
                <div className="nxp-empty-state">
                  <div className="nxp-empty-state__orb">
                    <i className="bi bi-check2-circle"></i>
                  </div>
                  <p className="nxp-empty-state__title">All caught up!</p>
                  <p className="nxp-empty-state__sub">No notifications here.</p>
                </div>
              )}

              {visibleNotifs.map((item, idx) => {
                const cfg = typeConfig(item.type);
                return (
                  <div
                    key={item.id}
                    className={`nxp-card${selectedId === item.id ? " nxp-card--active" : ""}${!item.read ? " nxp-card--unread" : ""}`}
                    onClick={() => openNotif(item.id)}
                    style={{ animationDelay: `${idx * 0.06}s` }}
                  >
                    {/* Icon */}
                    <div className={`nxp-card__iconbox ${cfg.cls}`}>
                      <i className={`bi ${cfg.icon}`}></i>
                      {!item.read && <span className="nxp-card__dot"></span>}
                    </div>

                    {/* Content */}
                    <div className="nxp-card__content">
                      <div className="nxp-card__toprow">
                        <span className="nxp-card__sender">{item.sender}</span>
                        <span className="nxp-card__time">{item.time}</span>
                      </div>
                      <p className="nxp-card__title">{item.title}</p>
                      <p className="nxp-card__preview">{item.message}</p>
                      <div className="nxp-card__tags">
                        <span className={`nxp-typetag nxp-typetag--${item.type}`}>{cfg.label}</span>
                        {item.replies?.length > 0 && (
                          <span className="nxp-replytag">
                            <i className="bi bi-chat-dots-fill"></i>
                            {item.replies.length} {item.replies.length === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="nxp-card__arrow">
                      <i className="bi bi-chevron-right"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ── RIGHT PANEL: THREAD ─────────────────────────────────────── */}
          {selectedId && selectedNotif ? (
            <section className="nxp-threadpanel">

              {/* Thread Topbar */}
              <div className="nxp-thread-topbar">
                <div className="nxp-thread-topbar__who">
                  <div className={`nxp-thread-topbar__avatar ${typeConfig(selectedNotif.type).cls}`}>
                    {selectedNotif.avatar}
                  </div>
                  <div className="nxp-thread-topbar__meta">
                    <p className="nxp-thread-topbar__name">{selectedNotif.sender}</p>
                    <p className="nxp-thread-topbar__detail">
                      {typeConfig(selectedNotif.type).label} · {selectedNotif.time}
                    </p>
                  </div>
                </div>
                <button className="nxp-closebtn" onClick={closeThread} title="Close">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Messages */}
              <div className="nxp-msgscroll">

                {/* Original message */}
                <div className="nxp-bubble nxp-bubble--in">
                  <div className="nxp-bubble__header">
                    <div className="nxp-bubble__avatar">{selectedNotif.avatar}</div>
                    <div className="nxp-bubble__who">
                      <span className="nxp-bubble__name">{selectedNotif.sender}</span>
                      <span className="nxp-bubble__timestamp">Original Message</span>
                    </div>
                  </div>
                  <div className="nxp-bubble__body">
                    <p className="nxp-bubble__text">{selectedNotif.message}</p>
                  </div>
                </div>

                {/* Thread divider */}
                {selectedNotif.replies?.length > 0 && (
                  <div className="nxp-divider">
                    <span>
                      {selectedNotif.replies.length} {selectedNotif.replies.length === 1 ? "Reply" : "Replies"}
                    </span>
                  </div>
                )}

                {/* Replies */}
                {selectedNotif.replies?.map((reply) => {
                  const isMe = reply.sender === "Me";
                  return (
                    <div key={reply.id} className={`nxp-bubble${isMe ? " nxp-bubble--out" : " nxp-bubble--in"}`}>
                      <div className="nxp-bubble__header">
                        <div className={`nxp-bubble__avatar${isMe ? " nxp-bubble__avatar--me" : ""}`}>
                          {reply.sender.substring(0, 2)}
                        </div>
                        <div className="nxp-bubble__who">
                          <span className="nxp-bubble__name">{reply.sender}</span>
                          <span className="nxp-bubble__timestamp">{reply.time}</span>
                        </div>
                      </div>
                      <div className="nxp-bubble__body">
                        {reply.text && <p className="nxp-bubble__text">{reply.text}</p>}
                        {/* Single file (legacy shape) */}
                        {reply.file && (
                          <NxpFileChip file={reply.file} downloadingFiles={downloadingFiles} onDownload={handleDownload} />
                        )}
                        {/* Multiple files */}
                        {reply.files?.map((f) => (
                          <NxpFileChip key={f.id} file={f} downloadingFiles={downloadingFiles} onDownload={handleDownload} />
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Compose Dock */}
              <div className="nxp-compose">

                {/* Staged files preview */}
                {selectedFiles.length > 0 && (
                  <div className="nxp-staged">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="nxp-staged__chip">
                        <i className={`bi ${getFileIcon(f.type, f.name)} nxp-staged__fileicon`}></i>
                        <span className="nxp-staged__filename" title={f.name}>{f.name}</span>
                        <span className="nxp-staged__filesize">{formatBytes(f.size)}</span>
                        <button className="nxp-staged__remove" onClick={() => removeFile(i)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input row */}
                <div className="nxp-compose__inputrow">
                  <button
                    className="nxp-compose__attachbtn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files"
                  >
                    <i className="bi bi-paperclip"></i>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="nxp-compose__fileinput"
                    onChange={handleFileChange}
                  />

                  <textarea
                    ref={textareaRef}
                    className="nxp-compose__textarea"
                    placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
                    value={replyText}
                    rows={1}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={onKeyDown}
                  />

                  <button
                    className={`nxp-compose__sendbtn${!canSend ? " nxp-compose__sendbtn--off" : ""}`}
                    onClick={sendReply}
                    disabled={!canSend}
                    title="Send"
                  >
                    {isUploading
                      ? <i className="bi bi-arrow-repeat nxp-spin"></i>
                      : <i className="bi bi-send-fill"></i>}
                  </button>
                </div>
              </div>

            </section>
          ) : (
            /* ── EMPTY STATE (no thread selected) ── */
            <div className="nxp-placeholder">
              <div className="nxp-placeholder__glow"></div>
              <div className="nxp-placeholder__orb">
                <i className="bi bi-chat-square-dots"></i>
              </div>
              <p className="nxp-placeholder__title">Open a conversation</p>
              <p className="nxp-placeholder__sub">Select a notification on the left to view and reply to the thread.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}