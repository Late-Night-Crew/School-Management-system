import { useCallback } from "react";
import { useParams } from "react-router-dom";

import { listAcademicYears } from "../../api/academicYears";
import { getRegion } from "../../api/regions";
import { listRegionDistricts, listRegionSchools } from "../../api/regionPortal";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import SchoolReport from "../../components/SchoolReport";
import TermComparison from "../../components/TermComparison";
import { Page } from "../../components/ui";

export default function RegionalReports() {
  const { regionId } = useParams();
  const lookups = useAsync(
    useCallback(
      () => Promise.all([getRegion(regionId), listRegionDistricts(regionId), listAcademicYears()]),
      [regionId]
    )
  );
  // The region is fixed by the URL, so only the district and year filters apply
  const loadReport = useCallback(
    ({ district_id, academic_year_id }) => listRegionSchools(regionId, { district_id, academic_year_id }),
    [regionId]
  );

  const [region, districts, academicYears] = lookups.data || [];

  return (
    <Page icon="bi-file-earmark-bar-graph" title="Reports" subtitle="School summary for your region, with exports for sharing.">
      <DataState loading={lookups.loading} error={lookups.error} onRetry={lookups.reload}>
        {lookups.data && (
          <SchoolReport
            loadReport={loadReport}
            districts={districts}
            academicYears={academicYears}
            scopeName={`${region.name} region`}
          />
        )}
        {lookups.data && <TermComparison academicYears={academicYears} regionId={regionId} />}
      </DataState>
    </Page>
  );
}
