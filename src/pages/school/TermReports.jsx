import { useCallback, useEffect, useState } from "react";

import { listTermReports, regenerateTermReport } from "../../api/termReports";
import useAsync from "../../hooks/useAsync";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import { Badge, Button, Card, Notice, StatTile, Table } from "../../components/ui";
import { formatDate, formatRate } from "../../utils/format";

const key = (r) => `${r.academic_year_id}-${r.term}`;
const mark = (v) => (v == null ? "-" : v.toFixed(1));

// A school's end-of-term reports: the current term worked out live, and each closed
// term as it was saved. base: the school's API path (see api/promotion).
export default function TermReports({ base }) {
  const reports = useAsync(useCallback(() => listTermReports(base), [base]));
  const [selected, setSelected] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const all = reports.data || [];
  const report = all.find((r) => key(r) === selected) || all[0];
  // Select the newest report when the list loads or the selected one disappears
  useEffect(() => {
    const list = reports.data || [];
    if (list.length && !list.some((r) => key(r) === selected)) setSelected(key(list[0]));
  }, [reports.data, selected]);

  const regenerate = async () => {
    setRegenerating(false);
    setBusy(true);
    setError("");
    try {
      await regenerateTermReport(base, report.academic_year_id, report.term);
      reports.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Pass rate per form across the saved terms, oldest first
  const saved = all.filter((r) => !r.live).reverse();
  const formsSeen = [...new Set(all.flatMap((r) => r.details?.forms.map((f) => f.form) || []))].sort();
  const formRate = (r, form) => r.details?.forms.find((f) => f.form === form)?.pass_rate;

  return (
    <DataState loading={reports.loading} error={reports.error} onRetry={reports.reload} empty={!all.length} emptyMessage="No term reports yet.">
      <div className="ui-grid">
        <Card accent="blue" icon="bi-calendar3" title="Terms" subtitle="Saved when each term closes; the current term updates as marks are entered" flush>
          <Table compact>
            <thead>
              <tr>
                <th>Term</th>
                <th className="num">Learners</th>
                <th className="num">Pass rate</th>
                <th>Status</th>
                <th className="end">Open</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={key(r)} style={key(r) === key(report) ? { background: "var(--tone-blue-bg)" } : undefined}>
                  <td className="strong">
                    {r.year} · Term {r.term}
                  </td>
                  <td className="num">{r.learners_assessed}</td>
                  <td className="num">{formatRate(r.pass_rate)}</td>
                  <td>
                    {r.live ? (
                      <Badge tone="blue">Current, live</Badge>
                    ) : r.out_of_date ? (
                      <Badge tone="amber">Marks changed</Badge>
                    ) : (
                      <Badge tone="green">Saved</Badge>
                    )}
                  </td>
                  <td className="end">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(key(r))}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {report && (
          <Card
            accent="purple"
            icon="bi-clipboard-data"
            title={`${report.year} · Term ${report.term}`}
            subtitle={
              report.live
                ? "The term is still open: figures change as marks are entered and are saved when the term closes."
                : `Saved ${formatDate(report.generated_at)}${report.generated_by_name ? ` by ${report.generated_by_name}` : ""}`
            }
          >
            <div className="ui-grid">
              {report.out_of_date && (
                <Notice tone="amber">
                  <span>Marks for this term were changed after the report was saved, so these figures may be out of date.</span>
                  <Button size="sm" variant="ghost" icon="bi-arrow-repeat" onClick={() => setRegenerating(true)} disabled={busy}>
                    {busy ? "Regenerating…" : "Regenerate"}
                  </Button>
                </Notice>
              )}
              {error && <Notice tone="red">{error}</Notice>}
              <div className="ui-grid ui-cols-3">
                <StatTile label="Learners assessed" value={report.learners_assessed} icon="bi-people" tone="blue" />
                <StatTile label="Average mark" value={mark(report.average_mark)} icon="bi-bar-chart" tone="purple" />
                <StatTile label="Pass rate" value={formatRate(report.pass_rate)} icon="bi-check2-circle" tone="green" />
                {report.term === 3 && (
                  <StatTile label="JCE pass rate (Form 2)" value={formatRate(report.jce_pass_rate)} icon="bi-award" tone="amber" />
                )}
                {report.term === 3 && (
                  <StatTile label="MSCE pass rate (Form 4)" value={formatRate(report.msce_pass_rate)} icon="bi-mortarboard" tone="amber" />
                )}
              </div>
              <Table compact>
                <thead>
                  <tr>
                    <th>Form</th>
                    <th className="num">Learners</th>
                    <th className="num">Average</th>
                    <th className="num">Passed</th>
                    <th className="num">Pass rate</th>
                    <th>To pass</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.details?.forms || []).map((f) => (
                    <tr key={f.form}>
                      <td className="strong">
                        Form {f.form}
                        {report.term === 3 && f.form === 2 && " (JCE)"}
                        {report.term === 3 && f.form === 4 && " (MSCE)"}
                      </td>
                      <td className="num">{f.learners}</td>
                      <td className="num">{mark(f.average_mark)}</td>
                      <td className="num">{f.passed}</td>
                      <td className="num">{formatRate(f.pass_rate)}</td>
                      <td>
                        {f.subjects_needed} subjects at {report.details.pass_mark}+{f.form % 2 === 0 ? ", incl. compulsory" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Table compact>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th className="num">Marks</th>
                    <th className="num">Average</th>
                    <th className="num">Pass rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.details?.subjects || []).map((s) => (
                    <tr key={s.subject_id}>
                      <td className="strong">{s.name}</td>
                      <td className="num">{s.marks}</td>
                      <td className="num">{mark(s.average_mark)}</td>
                      <td className="num">{formatRate(s.pass_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {saved.length > 1 && (
          <Card accent="green" icon="bi-graph-up" title="Progress by term" subtitle="Pass rate of each form in every saved term" flush>
            <Table compact>
              <thead>
                <tr>
                  <th>Form</th>
                  {saved.map((r) => (
                    <th key={key(r)} className="num">
                      {r.year} T{r.term}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formsSeen.map((form) => (
                  <tr key={form}>
                    <td className="strong">Form {form}</td>
                    {saved.map((r) => (
                      <td key={key(r)} className="num">
                        {formatRate(formRate(r, form))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
      <ConfirmModal
        show={regenerating}
        onHide={() => setRegenerating(false)}
        onConfirm={regenerate}
        danger={false}
        title="Regenerate report"
        confirmLabel="Regenerate"
        body={report && `Recalculate ${report.year} Term ${report.term} from the marks as they are now? The previous figures are replaced; the change is recorded in the audit log.`}
      />
    </DataState>
  );
}
