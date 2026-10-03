import { useCallback } from "react";

import { listAcademicYears } from "../../api/academicYears";
import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { getSchoolReport } from "../../api/reports";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import SchoolReport from "../../components/SchoolReport";
import { Page } from "../../components/ui";

export default function AdminReports() {
  const lookups = useAsync(useCallback(() => Promise.all([listRegions(), listDistricts(), listAcademicYears()]), []));
  const [regions, districts, academicYears] = lookups.data || [];

  return (
    <Page icon="bi-file-earmark-bar-graph" title="Reports" subtitle="National school summary, with exports for sharing.">
      <DataState loading={lookups.loading} error={lookups.error} onRetry={lookups.reload}>
        {lookups.data && (
          <SchoolReport
            loadReport={getSchoolReport}
            regions={regions}
            districts={districts}
            academicYears={academicYears}
            scopeName="All regions"
          />
        )}
      </DataState>
    </Page>
  );
}
