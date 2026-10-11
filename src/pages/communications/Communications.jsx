import { useCallback, useEffect, useState } from "react";

import { COMMS_CHANGED, getCommsSummary } from "../../api/comms";
import { ROLES, getSession } from "../../auth/session";
import useAsync from "../../hooks/useAsync";
import { Button, Notice, Page } from "../../components/ui";
import Conversations, { NewMessageDialog } from "./Conversations";
import NoticeInbox from "./NoticeInbox";
import ReportedConversations from "./ReportedConversations";
import SentNotices, { NewNoticeDialog } from "./SentNotices";

// Internal communication for every role, shown on each role's Notifications page.
//   School:          Notices (received), Messages
//   Regional admin:  Notices (received), Messages, Sent Notices
//   Super admin:     Messages, Sent Notices, Reported
export default function Communications() {
  const session = getSession();
  const isSuper = session?.role === ROLES.SUPER_ADMIN;
  const canSendNotices = isSuper || session?.role === ROLES.REGIONAL_ADMIN;

  const { data: summary, reload: reloadSummary } = useAsync(useCallback(() => getCommsSummary(), []));
  useEffect(() => {
    window.addEventListener(COMMS_CHANGED, reloadSummary);
    return () => window.removeEventListener(COMMS_CHANGED, reloadSummary);
  }, [reloadSummary]);

  const tabs = [
    !isSuper && { key: "notices", label: "Notices", icon: "bi-megaphone", count: summary?.unread_notices || null },
    { key: "messages", label: "Messages", icon: "bi-chat-left-text", count: summary?.unread_conversations || null },
    canSendNotices && { key: "sent", label: "Sent Notices", icon: "bi-send" },
    isSuper && { key: "reported", label: "Reported", icon: "bi-flag" },
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [openConversation, setOpenConversation] = useState(null);
  const [composing, setComposing] = useState(null); // "message" | "notice"
  const [refreshKey, setRefreshKey] = useState(0);
  const [alert, setAlert] = useState("");

  const showAlert = (message) => {
    setAlert(message);
    setTimeout(() => setAlert(""), 4000);
  };

  return (
    <Page
      icon="bi-bell"
      title="Notifications"
      subtitle={
        canSendNotices
          ? "Send notices to schools and offices, track who has read and completed them, and message other offices and schools."
          : "Notices from the ministry and your regional office, and private messages with other offices and schools."
      }
      stats={[
        !isSuper && { label: "Unread notices", value: summary?.unread_notices },
        !isSuper && { label: "To do", value: summary?.open_tasks },
        { label: "Unread messages", value: summary?.unread_conversations },
      ].filter(Boolean)}
      actions={
        <>
          <Button variant="ghost" icon="bi-chat-left-text" onClick={() => setComposing("message")}>
            New message
          </Button>
          {canSendNotices && (
            <Button variant="ghost" icon="bi-megaphone" onClick={() => setComposing("notice")}>
              New notice
            </Button>
          )}
        </>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {alert && <Notice tone="green">{alert}</Notice>}

      {activeTab === "notices" && <NoticeInbox />}
      {activeTab === "messages" && (
        <Conversations openId={openConversation} onOpen={setOpenConversation} refreshKey={refreshKey} />
      )}
      {activeTab === "sent" && <SentNotices refreshKey={refreshKey} onAlert={showAlert} />}
      {activeTab === "reported" && <ReportedConversations />}

      {composing === "message" && (
        <NewMessageDialog
          onHide={() => setComposing(null)}
          onStarted={(id) => {
            setComposing(null);
            setRefreshKey((key) => key + 1);
            setOpenConversation(id);
            setActiveTab("messages");
          }}
        />
      )}
      {composing === "notice" && (
        <NewNoticeDialog
          session={session}
          onHide={() => setComposing(null)}
          onSent={(message) => {
            setComposing(null);
            setRefreshKey((key) => key + 1);
            setActiveTab("sent");
            showAlert(message);
          }}
        />
      )}
    </Page>
  );
}
