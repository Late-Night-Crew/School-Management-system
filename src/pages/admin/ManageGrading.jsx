import { useCallback, useEffect, useState } from "react";

import { getGradingScale, saveGradingScale } from "../../api/grading";
import useAsync from "../../hooks/useAsync";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, IconButton, Input, Notice, Page, Switch, Table } from "../../components/ui";
import { formatDate } from "../../utils/format";
import { setGradingScale, withTones } from "../../utils/grades";
import styles from "./ManageGrading.module.css";

const MAX_BANDS = 12;

let nextKey = 0;
const toRow = (band) => ({
  key: nextKey++,
  grade: band.grade,
  min_mark: String(band.min_mark),
  is_pass: band.is_pass,
  description: band.description || "",
});

// What would be sent to the server, in the order the rows are shown
const toBands = (rows) =>
  rows.map((row) => ({
    grade: row.grade.trim().toUpperCase(),
    min_mark: row.min_mark === "" ? null : Number(row.min_mark),
    is_pass: row.is_pass,
    description: row.description.trim() || null,
  }));

const validMark = (mark) => Number.isInteger(mark) && mark >= 0 && mark <= 100;

// The same checks the server makes, so problems show while editing
function findProblems(bands) {
  const problems = [];
  if (bands.length < 2) problems.push("Add at least two grades: one that passes and one that fails.");
  if (bands.length > MAX_BANDS) problems.push(`Use at most ${MAX_BANDS} grades.`);
  if (bands.some((b) => !b.grade)) problems.push("Every grade needs a name, e.g. A.");
  const grades = bands.map((b) => b.grade).filter(Boolean);
  const repeatedGrades = grades.filter((g, i) => grades.indexOf(g) !== i);
  if (repeatedGrades.length) problems.push(`Grade ${repeatedGrades[0]} is used more than once.`);
  if (bands.some((b) => !validMark(b.min_mark))) problems.push("Every grade needs a starting mark from 0 to 100.");

  const valid = bands.filter((b) => validMark(b.min_mark)).sort((a, b) => b.min_mark - a.min_mark);
  const repeatedMark = valid.find((b, i) => i > 0 && b.min_mark === valid[i - 1].min_mark);
  if (repeatedMark) problems.push(`Two grades start at ${repeatedMark.min_mark}.`);
  if (valid.length && valid[valid.length - 1].min_mark !== 0) problems.push("The lowest grade must start at 0.");
  if (bands.length && !bands.some((b) => b.is_pass)) problems.push("At least one grade must count as a pass.");
  if (bands.length && bands.every((b) => b.is_pass)) problems.push("At least one grade must count as a fail.");
  const passBelowFail = valid.find((b, i) => b.is_pass && valid.slice(0, i).some((above) => !above.is_pass));
  if (passBelowFail) problems.push(`${passBelowFail.grade || "A grade"} counts as a pass but a higher grade does not.`);
  return problems;
}

// The grading scale used for every mark: letter grades, the mark range each covers and
// which grades count as a pass. Schools see the new scale as soon as it is saved.
export default function ManageGrading() {
  const scale = useAsync(useCallback(() => getGradingScale(), []));
  const [rows, setRows] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

  const reset = useCallback(() => setRows((scale.data?.bands || []).map(toRow)), [scale.data]);
  useEffect(reset, [reset]);

  const bands = toBands(rows);
  const problems = findProblems(bands);
  const saved = toBands((scale.data?.bands || []).map(toRow));
  const dirty = JSON.stringify(bands) !== JSON.stringify(saved);

  // Bands as they will apply, highest first, for the "To" column and badge previews
  const ordered = bands
    .map((band, index) => ({ ...band, index }))
    .filter((band) => validMark(band.min_mark))
    .sort((a, b) => b.min_mark - a.min_mark);
  const preview = withTones({ bands: ordered }).bands;
  const previewFor = (index) => preview.find((band) => band.index === index);
  const maxMarkFor = (index) => {
    const position = preview.findIndex((band) => band.index === index);
    if (position < 0 || ordered.filter((b) => b.min_mark === ordered[position].min_mark).length > 1) return null;
    return position === 0 ? 100 : preview[position - 1].min_mark - 1;
  };
  const passMark = problems.length ? null : Math.min(...bands.filter((b) => b.is_pass).map((b) => b.min_mark));

  const update = (key, field, value) => setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  const remove = (key) => setRows((prev) => prev.filter((row) => row.key !== key));
  const add = () => setRows((prev) => [...prev, toRow({ grade: "", min_mark: "", is_pass: false })]);

  const handleSave = async () => {
    setConfirming(false);
    setSaving(true);
    try {
      const result = await saveGradingScale(bands);
      setGradingScale(result);
      scale.reload();
      showToast(`Grading scale saved. The pass mark is now ${result.pass_mark}.`);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      icon="bi-award"
      title="Grading Scale"
      subtitle="Letter grades, the marks each one covers and the pass mark, for every school's marks and reports."
      stats={[
        { label: "Grades", value: scale.loading ? null : scale.data?.bands.length },
        { label: "Pass mark", value: scale.loading ? null : scale.data?.pass_mark },
      ]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={add} disabled={scale.loading || rows.length >= MAX_BANDS}>
          Add Grade
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <Card
        accent="purple"
        icon="bi-bar-chart-steps"
        title="Grades"
        subtitle={
          scale.data?.updated_at
            ? `Each grade runs from its starting mark up to the next grade · Last changed ${formatDate(scale.data.updated_at)}`
            : "Each grade runs from its starting mark up to the next grade"
        }
        flush
        footer={
          !scale.loading &&
          !scale.error && (
            <div className={styles.footer}>
              <span className={styles.passMark}>
                {passMark == null ? "Fix the problems above to see the pass mark." : `Marks of ${passMark} and above pass.`}
              </span>
              <div className={styles.footerActions}>
                <Button variant="ghost" onClick={reset} disabled={!dirty || saving}>
                  Discard changes
                </Button>
                <Button icon="bi-check-lg" onClick={() => setConfirming(true)} disabled={!dirty || problems.length > 0 || saving}>
                  {saving ? "Saving…" : "Save scale"}
                </Button>
              </div>
            </div>
          )
        }
      >
        <DataState loading={scale.loading} error={scale.error} onRetry={scale.reload}>
          <Table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>From</th>
                <th>To</th>
                <th>Counts as a pass</th>
                <th>Description</th>
                <th className="center">Preview</th>
                <th className="end">Remove</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const max = maxMarkFor(index);
                const tone = previewFor(index)?.tone || "slate";
                return (
                  <tr key={row.key}>
                    <td>
                      <Input
                        className={styles.gradeInput}
                        value={row.grade}
                        maxLength={10}
                        placeholder="e.g. A"
                        aria-label="Grade"
                        onChange={(e) => update(row.key, "grade", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        className={styles.markInput}
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={row.min_mark}
                        aria-label={`Starting mark for ${row.grade || "this grade"}`}
                        onChange={(e) => update(row.key, "min_mark", e.target.value)}
                      />
                    </td>
                    <td className="num">{max == null ? "-" : max}</td>
                    <td>
                      <Switch checked={row.is_pass} onChange={(value) => update(row.key, "is_pass", value)}>
                        {row.is_pass ? "Pass" : "Fail"}
                      </Switch>
                    </td>
                    <td>
                      <Input
                        className={styles.descriptionInput}
                        value={row.description}
                        maxLength={100}
                        placeholder="e.g. Distinction"
                        aria-label={`Description for ${row.grade || "this grade"}`}
                        onChange={(e) => update(row.key, "description", e.target.value)}
                      />
                    </td>
                    <td className="center">
                      <Badge tone={tone}>{row.grade.trim().toUpperCase() || "-"}</Badge>
                    </td>
                    <td className="end">
                      <IconButton kind="delete" title={`Remove ${row.grade || "this grade"}`} onClick={() => remove(row.key)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </DataState>
      </Card>

      {!scale.loading && problems.length > 0 && (
        <Notice tone="amber">
          <ul className={styles.problems}>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </Notice>
      )}

      <ConfirmModal
        show={confirming}
        onHide={() => setConfirming(false)}
        onConfirm={handleSave}
        title="Save Grading Scale"
        confirmLabel="Save scale"
        danger={false}
        body={`Grades and pass rates on every school's marks and reports will use the new scale straight away, including marks already recorded. The pass mark will be ${passMark}.`}
      />
    </Page>
  );
}
