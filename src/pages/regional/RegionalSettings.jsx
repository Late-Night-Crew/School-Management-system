import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { getRegion } from "../../api/regions";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import { ChangePasswordCard, MyAccountCard } from "../../components/MyAccountCards";
import { Card, Page } from "../../components/ui";

export default function RegionalSettings() {
  const { regionId } = useParams();
  const region = useAsync(useCallback(() => getRegion(regionId), [regionId]));

  return (
    <Page
      icon="bi-gear-fill"
      title="Settings"
      subtitle="Your contact numbers and password. Division office details are edited on the Contacts page."
    >
      <div className="ui-grid ui-cols-2">
        <MyAccountCard />
        <Card accent="purple" icon="bi-map" title="Region" subtitle="The region you manage">
          <DataState loading={region.loading} error={region.error} onRetry={region.reload}>
            <DetailRow label="Name" value={region.data?.name} />
            <DetailRow label="Region ID" value={regionId} />
          </DataState>
        </Card>
        <ChangePasswordCard />
      </div>
    </Page>
  );
}
