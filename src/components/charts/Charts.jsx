import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart as RLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TEXT, GRID, percentOf } from "../../utils/charts";
import styles from "./Charts.module.css";

const AXIS = { stroke: GRID, tick: { fill: AXIS_TEXT, fontSize: 12 }, tickLine: false };
const identity = (v) => v;

// Value first, then what it is; each row keyed by a short stroke of its colour.
function TooltipBox({ title, rows, extra }) {
  return (
    <div className={styles.tooltip}>
      {title && <div className={styles.tooltipTitle}>{title}</div>}
      {rows.map((r) => (
        <div key={r.name} className={styles.tooltipRow}>
          <span className={styles.key} style={{ background: r.color }} />
          <strong>{r.value}</strong>
          <span className={styles.tooltipName}>{r.name}</span>
        </div>
      ))}
      {extra && <div className={styles.tooltipExtra}>{extra}</div>}
    </div>
  );
}

// Legend for two or more series; text stays in ink, the swatch carries the colour.
export function Legend({ items }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.name}>
          <span className={item.line ? styles.lineKey : styles.swatch} style={{ background: item.color }} />
          <span>{item.name}</span>
          {item.value != null && <strong>{item.value}</strong>}
        </li>
      ))}
    </ul>
  );
}

// Part of a whole. data: [{ name, value, color }]; empty slices are left out.
export function DonutChart({ data, centerLabel = "Total" }) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TooltipBox
                    rows={[{ name: payload[0].name, value: `${payload[0].value.toLocaleString()} · ${percentOf(payload[0].value, total)}`, color: payload[0].payload.color }]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <strong>{total.toLocaleString()}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <Legend items={data.map((d) => ({ ...d, value: `${d.value.toLocaleString()} (${percentOf(d.value, total)})` }))} />
    </div>
  );
}

// Columns (or bars with `horizontal`). series: [{ key, name, color }]; several series
// stack when `stacked`. One series gets its value at the tip of each bar.
export function BarChart({ data, xKey, series, stacked = false, horizontal = false, format = identity, domain, height, tooltipExtra }) {
  const single = series.length === 1;
  const rows = data.length;
  const chartHeight = height || (horizontal ? Math.max(240, rows * 36 + 40) : 240);
  const valueAxis = { ...AXIS, type: "number", domain: domain || [0, "auto"], tickFormatter: format, allowDecimals: false };
  const categoryAxis = { ...AXIS, type: "category", dataKey: xKey, interval: 0 };
  return (
    <div>
      {!single && <Legend items={series} />}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RBarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 18, right: 36, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis {...valueAxis} />
              <YAxis {...categoryAxis} width={110} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis {...categoryAxis} />
              <YAxis {...valueAxis} width={44} axisLine={false} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "rgba(37, 99, 168, 0.06)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox
                  title={label}
                  rows={[...payload].reverse().map((p) => ({ name: p.name, value: format(p.value), color: p.color }))}
                  extra={tooltipExtra?.(payload[0].payload)}
                />
              ) : null
            }
          />
          {series.map((s, i) => {
            const top = !stacked || i === series.length - 1;
            const radius = top ? (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0;
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                stackId={stacked ? "all" : undefined}
                radius={radius}
                maxBarSize={24}
                stroke="#fff"
                strokeWidth={stacked ? 1 : 0}
                isAnimationActive={false}
              >
                {single && <LabelList dataKey={s.key} position={horizontal ? "right" : "top"} formatter={format} className={styles.barLabel} />}
              </Bar>
            );
          })}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// A trend over time. series: [{ key, name, color }]; the last point carries its value.
export function LineChart({ data, xKey, series, format = identity, domain, height = 240, tooltipExtra }) {
  return (
    <div>
      {series.length > 1 && <Legend items={series.map((s) => ({ ...s, line: true }))} />}
      <ResponsiveContainer width="100%" height={height}>
        <RLineChart data={data} margin={{ top: 18, right: 40, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis {...AXIS} dataKey={xKey} interval="preserveStartEnd" />
          <YAxis {...AXIS} domain={domain || [0, "auto"]} tickFormatter={format} width={44} axisLine={false} />
          <Tooltip
            cursor={{ stroke: AXIS_TEXT, strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipBox
                  title={label}
                  rows={payload.map((p) => ({ name: p.name, value: format(p.value), color: p.color }))}
                  extra={tooltipExtra?.(payload[0].payload)}
                />
              ) : null
            }
          />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
            >
              <LabelList
                dataKey={s.key}
                content={({ x, y, value, index }) =>
                  index === data.length - 1 && value != null ? (
                    <text x={x + 8} y={y - 8} className={styles.lineLabel}>
                      {format(value)}
                    </text>
                  ) : null
                }
              />
            </Line>
          ))}
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
