import { ChangePasswordCard, MyAccountCard } from "../../components/MyAccountCards";
import { Page } from "../../components/ui";

export default function AdminSettings() {
  return (
    <Page icon="bi-gear-fill" title="Settings" subtitle="Your contact numbers and password.">
      <div className="ui-grid ui-cols-2">
        <MyAccountCard />
        <ChangePasswordCard />
      </div>
    </Page>
  );
}
