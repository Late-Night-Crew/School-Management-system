import { Card, EmptyState, Page } from "./ui";

// Notifications are not built yet (no backend), so every role's Notifications page shows this.
export default function NotificationsPlaceholder({ hint }) {
  return (
    <Page icon="bi-bell" title="Notifications" subtitle="Alerts about transfers and other activity.">
      <Card accent="slate">
        <EmptyState icon="bi-bell-slash" title="Notifications are not available yet">
          {hint}
        </EmptyState>
      </Card>
    </Page>
  );
}
