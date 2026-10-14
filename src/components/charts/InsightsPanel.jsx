import { GENDER_COLORS, MUTED, SERIES, STATUS_COLORS, STATUS_NAMES, TERM_RAMP, pct } from "../../utils/charts";
import ChartCard from "./ChartCard";
import { BarChart, DonutChart, LineChart } from "./Charts";

const termName = (t) => `${t.year} T${t.term}`;
const TERM_NAMES = { 0: "Not started", 1: "Term 1", 2: "Term 2", 3: "Term 3" };
const TERM_COLORS = { 1: TERM_RAMP[0], 2: TERM_RAMP[1], 3: TERM_RAMP[2], 0: MUTED };

// The dashboard charts for the whole country, a division or a school.
// areaLabel: what the areas are ("Division" or "District"); none for a school.
export default function InsightsPanel({ insights, areaLabel }) {
  const { learners_by_form: byForm, gender, statuses, areas, school_terms: schoolTerms, performance } = insights;
  const { terms, latest, forms, subjects, areas: areaRates } = performance;
  const latestName = latest ? `${latest.year} Term ${latest.term}${latest.live ? " (so far)" : ""}` : "";
  const showAreas = Boolean(areaLabel);

  const genderData = [
    { name: "Male", value: gender.male, color: GENDER_COLORS.Male },
    { name: "Female", value: gender.female, color: GENDER_COLORS.Female },
    ...(gender.other ? [{ name: "Not recorded", value: gender.other, color: GENDER_COLORS["Not recorded"] }] : []),
  ];
  const statusData = ["Active", "Withdrawn", "DroppedOut", "Completed"].map((s) => {
    const name = STATUS_NAMES[s];
    return { name, value: statuses.find((x) => x.status === s)?.learners || 0, color: STATUS_COLORS[name] };
  });
  const formData = byForm.map((f) => ({ ...f, name: `Form ${f.form}`, total: f.male + f.female + f.other }));
  const learners = gender.male + gender.female + gender.other;
  const trend = terms.map((t) => ({ ...t, name: termName(t) }));
  const subjectData = subjects.map((s) => ({ ...s, average: s.average_mark == null ? null : Math.round(s.average_mark) }));
  const stageData = [1, 2, 3, 0].map((term) => ({
    name: TERM_NAMES[term],
    value: schoolTerms.find((s) => s.term === term)?.schools || 0,
    color: TERM_COLORS[term],
  }));

  return (
    <div className="ui-grid">
      <div className="ui-grid ui-cols-2">
        <ChartCard
          icon="bi-bar-chart"
          title="Learners by form"
          subtitle="Current learners, by gender"
          empty={!learners}
          emptyMessage="No learners enrolled yet."
          table={{
            columns: ["Form", "Male", "Female", "Total"],
            rows: formData.map((f) => [f.name, f.male, f.female, f.total]),
          }}
        >
          <BarChart
            data={formData}
            xKey="name"
            stacked
            series={[
              { key: "male", name: "Male", color: GENDER_COLORS.Male },
              { key: "female", name: "Female", color: GENDER_COLORS.Female },
              ...(gender.other ? [{ key: "other", name: "Not recorded", color: MUTED }] : []),
            ]}
            tooltipExtra={(row) => `${row.total.toLocaleString()} learners`}
          />
        </ChartCard>

        <ChartCard
          icon="bi-pie-chart"
          accent="purple"
          title="Gender"
          subtitle="Current learners"
          empty={!learners}
          emptyMessage="No learners enrolled yet."
          table={{ columns: ["Gender", "Learners"], rows: genderData.map((d) => [d.name, d.value]) }}
        >
          <DonutChart data={genderData} centerLabel="learners" />
        </ChartCard>
      </div>

      <div className="ui-grid ui-cols-2">
        <ChartCard
          icon="bi-person-check"
          accent="green"
          title="Learner status"
          subtitle="Everyone ever enrolled: still learning, left, or finished Form 4"
          empty={!statusData.some((d) => d.value)}
          emptyMessage="No learners enrolled yet."
          table={{ columns: ["Status", "Learners"], rows: statusData.map((d) => [d.name, d.value]) }}
        >
          <DonutChart data={statusData} centerLabel="learners" />
        </ChartCard>

        {showAreas ? (
          <ChartCard
            icon="bi-calendar3"
            accent="amber"
            title="Schools by term"
            subtitle="The term each open school is in now"
            empty={!stageData.some((d) => d.value)}
            emptyMessage="No open schools yet."
            table={{ columns: ["Term", "Schools"], rows: stageData.map((d) => [d.name, d.value]) }}
          >
            <DonutChart data={stageData} centerLabel="schools" />
          </ChartCard>
        ) : (
          <ChartCard
            icon="bi-graph-up"
            accent="amber"
            title="Pass rate by term"
            subtitle="Learners who passed enough subjects to move up, each term of the last three years"
            empty={!trend.length}
            emptyMessage="No term reports yet. A term's figures appear once marks are entered."
            table={{
              columns: ["Term", "Learners", "Pass rate", "Average mark"],
              rows: trend.map((t) => [t.name + (t.live ? " (so far)" : ""), t.learners, pct(t.pass_rate), pct(t.average_mark).replace("%", "")]),
            }}
          >
            <PassRateTrend trend={trend} />
          </ChartCard>
        )}
      </div>

      {showAreas && (
        <div className="ui-grid ui-cols-2">
          <ChartCard
            icon="bi-geo-alt"
            title={`Learners by ${areaLabel.toLowerCase()}`}
            subtitle={`Current learners and open schools in each ${areaLabel.toLowerCase()}`}
            empty={!areas.length}
            emptyMessage={`No ${areaLabel.toLowerCase()}s set up yet.`}
            table={{
              columns: [areaLabel, "Schools", "Learners", "Female"],
              rows: areas.map((a) => [a.name, a.schools, a.learners, a.female]),
            }}
          >
            <BarChart
              data={areas}
              xKey="name"
              horizontal
              series={[{ key: "learners", name: "Learners", color: SERIES[0] }]}
              format={(v) => v.toLocaleString()}
              tooltipExtra={(a) => `${a.schools} open school${a.schools === 1 ? "" : "s"} · ${a.female} female`}
            />
          </ChartCard>

          <ChartCard
            icon="bi-graph-up"
            accent="amber"
            title="Pass rate by term"
            subtitle="Learners who passed enough subjects to move up, over the last three years of term reports"
            empty={!trend.length}
            emptyMessage="No term reports yet. They are saved as each school closes a term."
            table={{
              columns: ["Term", "Schools", "Learners", "Pass rate", "Average mark"],
              rows: trend.map((t) => [t.name, t.schools, t.learners, pct(t.pass_rate), pct(t.average_mark).replace("%", "")]),
            }}
          >
            <PassRateTrend trend={trend} showSchools />
          </ChartCard>
        </div>
      )}

      <div className={`ui-grid ${showAreas ? "ui-cols-3" : "ui-cols-2"}`}>
        {showAreas && (
          <ChartCard
            icon="bi-trophy"
            accent="green"
            title={`Pass rate by ${areaLabel.toLowerCase()}`}
            subtitle={latestName}
            empty={!areaRates.length}
            emptyMessage="No term reports yet."
            table={{ columns: [areaLabel, "Learners", "Pass rate"], rows: areaRates.map((a) => [a.name, a.learners, pct(a.pass_rate)]) }}
          >
            <BarChart
              data={areaRates}
              xKey="name"
              horizontal
              domain={[0, 100]}
              series={[{ key: "pass_rate", name: "Pass rate", color: SERIES[0] }]}
              format={pct}
              tooltipExtra={(a) => `${a.learners.toLocaleString()} learners assessed`}
            />
          </ChartCard>
        )}

        <ChartCard
          icon="bi-mortarboard"
          accent="purple"
          title="Pass rate by form"
          subtitle={latestName}
          empty={!forms.length}
          emptyMessage="No term reports yet."
          table={{
            columns: ["Form", "Learners", "Passed", "Pass rate"],
            rows: forms.map((f) => [`Form ${f.form}`, f.learners, f.passed, pct(f.pass_rate)]),
          }}
        >
          <BarChart
            data={forms.map((f) => ({ ...f, name: `Form ${f.form}` }))}
            xKey="name"
            domain={[0, 100]}
            series={[{ key: "pass_rate", name: "Pass rate", color: SERIES[0] }]}
            format={pct}
            tooltipExtra={(f) => `${f.passed} of ${f.learners} passed · ${f.subjects_needed} subjects needed`}
          />
        </ChartCard>

        <ChartCard
          icon="bi-book"
          title="Subject averages"
          subtitle={latestName}
          empty={!subjectData.length}
          emptyMessage="No term reports yet."
          table={{
            columns: ["Subject", "Marks", "Average", "Pass rate"],
            rows: subjectData.map((s) => [s.name, s.marks, s.average ?? "-", pct(s.pass_rate)]),
          }}
        >
          <BarChart
            data={subjectData}
            xKey="name"
            horizontal
            domain={[0, 100]}
            series={[{ key: "average", name: "Average mark", color: SERIES[0] }]}
            tooltipExtra={(s) => `${pct(s.pass_rate)} of marks a pass · ${s.marks} marks`}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function PassRateTrend({ trend, showSchools = false }) {
  return (
    <LineChart
      data={trend}
      xKey="name"
      domain={[0, 100]}
      format={pct}
      series={[{ key: "pass_rate", name: "Pass rate", color: SERIES[0] }]}
      tooltipExtra={(t) =>
        [
          `${t.learners.toLocaleString()} learners${showSchools ? ` · ${t.schools} school${t.schools === 1 ? "" : "s"}` : ""}`,
          t.jce_pass_rate != null && `JCE ${pct(t.jce_pass_rate)}`,
          t.msce_pass_rate != null && `MSCE ${pct(t.msce_pass_rate)}`,
          t.live && "Term still open",
        ]
          .filter(Boolean)
          .join(" · ")
      }
    />
  );
}
