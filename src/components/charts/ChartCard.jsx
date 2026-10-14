import { useState } from "react";

import { Card, EmptyState, Segmented, Table } from "../ui";

const VIEWS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
];

// A card holding one chart, with a table of the same figures one click away.
// table: { columns: [label], rows: [[cell]] }; numeric columns after the first.
export default function ChartCard({ title, subtitle, icon, accent = "blue", table, empty, emptyMessage = "Nothing to show yet.", children }) {
  const [view, setView] = useState("chart");
  return (
    <Card
      accent={accent}
      icon={icon}
      title={title}
      subtitle={subtitle}
      actions={!empty && table && <Segmented options={VIEWS} value={view} onChange={setView} />}
      flush={!empty && view === "table"}
    >
      {empty ? (
        <EmptyState icon="bi-bar-chart" title={emptyMessage} />
      ) : view === "table" ? (
        <Table compact>
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={c} className={i ? "num" : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={i ? "num" : "strong"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        children
      )}
    </Card>
  );
}
