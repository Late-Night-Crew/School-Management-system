import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { getSchool } from "../../api/schools";
import { ROLE_LABELS, getSession } from "../../auth/session";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import { Card, Page } from "../../components/ui";

// Read-only for now: there are no endpoints for editing accounts or school profiles.
export default function SchoolSettings() {
  const { schoolId } = useParams();
  const session = getSession();
  const school = useAsync(
    useCallback(async () => {
      const [details, districts, regions] = await Promise.all([getSchool(schoolId), listDistricts(), listRegions()]);
      const district = districts.find((d) => d.id === details.district_id);
      const region = regions.find((r) => r.id === district?.region_id);
      return { ...details, districtName: district?.name, regionName: region?.name };
    }, [schoolId])
  );

  return (
    <Page
      icon="bi-gear-fill"
      title="Settings"
      subtitle="Your account and school details. Contact the system administrator to change them."
    >
      <div className="ui-grid ui-cols-2">
        <Card accent="blue" icon="bi-person-circle" title="Account" subtitle="The account you are signed in with">
          <DetailRow label="Name" value={session?.displayName} />
          <DetailRow label="Email" value={session?.email} />
          <DetailRow label="Role" value={ROLE_LABELS[session?.role]} />
        </Card>
        <Card accent="green" icon="bi-building" title="School" subtitle="The school you manage">
          <DataState loading={school.loading} error={school.error} onRetry={school.reload}>
            <DetailRow label="Name" value={school.data?.name} />
            <DetailRow label="School Number" value={school.data?.school_number} />
            <DetailRow label="District" value={school.data?.districtName} />
            <DetailRow label="Division" value={school.data?.regionName} />
          </DataState>
        </Card>
      </div>
    </Page>
  );
}
