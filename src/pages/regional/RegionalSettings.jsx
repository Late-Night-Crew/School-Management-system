import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { getRegion } from "../../api/regions";
import { ROLE_LABELS, getSession } from "../../auth/session";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import { Card, Page } from "../../components/ui";

export default function RegionalSettings() {
  const { regionId } = useParams();
  const session = getSession();
  const region = useAsync(useCallback(() => getRegion(regionId), [regionId]));

  return (
    <Page
      icon="bi-gear-fill"
      title="Settings"
      subtitle="Your account and region details. Contact the system administrator to change them."
    >
      <div className="ui-grid ui-cols-2">
        <Card accent="blue" icon="bi-person-circle" title="Account" subtitle="The account you are signed in with">
          <DetailRow label="Name" value={session?.displayName} />
          <DetailRow label="Email" value={session?.email} />
          <DetailRow label="Role" value={ROLE_LABELS[session?.role]} />
        </Card>
        <Card accent="purple" icon="bi-map" title="Region" subtitle="The region you manage">
          <DataState loading={region.loading} error={region.error} onRetry={region.reload}>
            <DetailRow label="Name" value={region.data?.name} />
            <DetailRow label="Region ID" value={regionId} />
          </DataState>
        </Card>
      </div>
    </Page>
  );
}
