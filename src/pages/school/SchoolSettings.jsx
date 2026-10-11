import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { getSchool } from "../../api/schools";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import DetailRow from "../../components/DetailRow";
import { ChangePasswordCard, MyAccountCard } from "../../components/MyAccountCards";
import { Card, Page } from "../../components/ui";

export default function SchoolSettings() {
  const { schoolId } = useParams();
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
      subtitle="Your contact numbers and password. School office details are edited on the Contacts page."
    >
      <div className="ui-grid ui-cols-2">
        <MyAccountCard />
        <Card accent="green" icon="bi-building" title="School" subtitle="The school you manage">
          <DataState loading={school.loading} error={school.error} onRetry={school.reload}>
            <DetailRow label="Name" value={school.data?.name} />
            <DetailRow label="School Number" value={school.data?.school_number} />
            <DetailRow label="District" value={school.data?.districtName} />
            <DetailRow label="Division" value={school.data?.regionName} />
          </DataState>
        </Card>
        <ChangePasswordCard />
      </div>
    </Page>
  );
}
