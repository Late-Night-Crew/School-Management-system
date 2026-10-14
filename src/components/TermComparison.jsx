import { useCallback, useState } from "react";

import { compareTerm } from "../api/termReports";
import useAsync from "../hooks/useAsync";
import { formatRate } from "../utils/format";
import { startedYears } from "../utils/years";
import DataState from "./DataState";
import { Card, Field, Select, Table } from "./ui";

const average = (values) => {
  const present = values.filter((v) => v != null);
  return present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;
};

// Schools side by side for one term, from their saved end-of-term reports. Term 3
// includes the JCE (Form 2) and MSCE (Form 4) pass rates. regionId limits it to a
// division (division officers); MCDE sees every division with subtotals.
export default function TermComparison({ academicYears, regionId }) {
  const sortedYears = startedYears(academicYears).sort((a, b) => b.year - a.year);
  const active = sortedYears.find((y) => y.status === "Active") || sortedYears[0];
  const [yearId, setYearId] = useState(active ? String(active.id) : "");
  const [term, setTerm] = useState("1");

  const rows = useAsync(
    useCallback(
      () => (yearId ? compareTerm({ academic_year_id: yearId, term }, regionId) : Promise.resolve([])),
      [yearId, term, regionId]
    )
  );
  const all = rows.data || [];
  const isTerm3 = term === "3";
  const divisions = [...new Set(all.map((r) => r.region_name))];

  const totals = (list) => ({
    learners: list.reduce((sum, r) => sum + r.learners_assessed, 0),
    average: average(list.map((r) => r.average_mark)),
    pass: average(list.map((r) => r.pass_rate)),
    jce: average(list.map((r) => r.jce_pass_rate)),
    msce: average(list.map((r) => r.msce_pass_rate)),
  });
  const totalRow = (label, t, key) => (
    <tr key={key} className="strong">
      <td colSpan={2}>{label}</td>
      <td className="num">{t.learners}</td>
      <td className="num">{t.average == null ? "-" : t.average.toFixed(1)}</td>
      <td className="num">{formatRate(t.pass)}</td>
      {isTerm3 && <td className="num">{formatRate(t.jce)}</td>}
      {isTerm3 && <td className="num">{formatRate(t.msce)}</td>}
    </tr>
  );

  return (
    <Card
      accent="purple"
      icon="bi-bar-chart-steps"
      title="Results by term"
      subtitle="From each school's report, saved when the term closed. Schools that have not closed the term are not listed yet."
      actions={
        <div className="d-flex gap-2">
          <Field>
            <Select value={yearId} onChange={(e) => setYearId(e.target.value)} aria-label="Academic year">
              {sortedYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Select value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Term">
              {[1, 2, 3].map((t) => (
                <option key={t} value={t}>
                  Term {t}
                  {t === 3 ? " (JCE / MSCE)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      }
      flush
    >
      <DataState
        loading={rows.loading}
        error={rows.error}
        onRetry={rows.reload}
        empty={!all.length}
        emptyMessage="No school has closed this term yet."
      >
        <Table>
          <thead>
            <tr>
              <th>School</th>
              <th>District</th>
              <th className="num">Learners assessed</th>
              <th className="num">Average mark</th>
              <th className="num">Pass rate</th>
              {isTerm3 && <th className="num">JCE (Form 2)</th>}
              {isTerm3 && <th className="num">MSCE (Form 4)</th>}
            </tr>
          </thead>
          <tbody>
            {divisions.flatMap((division) => {
              const list = all.filter((r) => r.region_name === division);
              return [
                ...list.map((r) => (
                  <tr key={r.school_id}>
                    <td>
                      <div className="strong">{r.school_name}</div>
                      <div className="ui-hint">{r.school_number}</div>
                    </td>
                    <td>{r.district_name}</td>
                    <td className="num">{r.learners_assessed}</td>
                    <td className="num">{r.average_mark == null ? "-" : r.average_mark.toFixed(1)}</td>
                    <td className="num">{formatRate(r.pass_rate)}</td>
                    {isTerm3 && <td className="num">{formatRate(r.jce_pass_rate)}</td>}
                    {isTerm3 && <td className="num">{formatRate(r.msce_pass_rate)}</td>}
                  </tr>
                )),
                ...(regionId ? [] : [totalRow(`${division} division`, totals(list), `total-${division}`)]),
              ];
            })}
            {totalRow(regionId ? "Division total" : "National total", totals(all), "total-all")}
          </tbody>
        </Table>
      </DataState>
    </Card>
  );
}
