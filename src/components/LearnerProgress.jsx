import { useCallback } from "react";

import { getLearnerProgress } from "../api/termReports";
import useAsync from "../hooks/useAsync";
import DataState from "./DataState";
import { Badge, Card, Table } from "./ui";

// One learner's results term by term, newest first, with the change from the term
// before, so a learner slipping before the deciding Term 3 stands out.
// base: the school's API path (see api/promotion schoolPromotionBase).
export default function LearnerProgress({ base, studentId }) {
  const progress = useAsync(useCallback(() => getLearnerProgress(base, studentId), [base, studentId]));
  const terms = progress.data?.terms || [];

  const change = (i) => {
    const before = terms[i + 1];
    if (!before) return null;
    const diff = terms[i].average_mark - before.average_mark;
    if (Math.abs(diff) < 0.5) return <Badge tone="slate">steady</Badge>;
    return <Badge tone={diff > 0 ? "green" : "red"}>{`${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)}`}</Badge>;
  };

  return (
    <Card
      accent="green"
      icon="bi-graph-up"
      title="Progress by term"
      subtitle={progress.data ? `Subjects at ${progress.data.pass_mark} or above count as passed` : ""}
      flush
    >
      <DataState loading={progress.loading} error={progress.error} onRetry={progress.reload} empty={!terms.length} emptyMessage="No marks yet.">
        <Table compact>
          <thead>
            <tr>
              <th>Term</th>
              <th className="num">Subjects passed</th>
              <th className="num">Average</th>
              <th>Change</th>
              <th>School</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t, i) => (
              <tr key={`${t.academic_year_id}-${t.term}`}>
                <td className="strong">
                  {t.year} · Term {t.term}
                </td>
                <td className="num">
                  {t.subjects_passed} of {t.subjects_marked}
                </td>
                <td className="num">{t.average_mark.toFixed(1)}</td>
                <td>{change(i)}</td>
                <td>{t.school_name}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </DataState>
    </Card>
  );
}
