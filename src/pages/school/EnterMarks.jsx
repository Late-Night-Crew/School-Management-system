import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { listAcademicYears } from "../../api/academicYears";
import { listAllSchoolStudents, listSchoolMarks, saveSchoolMarks } from "../../api/schoolPortal";
import { listSubjects } from "../../api/subjects";
import {
  getStage,
  listSchoolMarksAsAdmin,
  listSchoolStudentsAsAdmin,
  listSchoolYearMarksAsAdmin,
  saveSchoolMarksAsAdmin,
  schoolPromotionBase,
} from "../../api/promotion";
import { getSchool } from "../../api/schools";
import { ROLES, getSession } from "../../auth/session";
import { startedYears } from "../../utils/years";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { fullName } from "../../utils/format";
import { average, formatMark, passRate, useGradingScale } from "../../utils/grades";
import DataState from "../../components/DataState";
import GradeBadge from "../../components/GradeBadge";
import TablePagination from "../../components/TablePagination";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, Field, IconButton, Input, Notice, Page, Person, Segmented, Select, StatTile, Table } from "../../components/ui";
import styles from "./EnterMarks.module.css";

const TERMS = [1, 2, 3];
const TERM_OPTIONS = TERMS.map((t) => ({ value: t, label: `Term ${t}` }));
const FORMS = [1, 2, 3, 4];
const cellKey = (studentId, subjectId) => `${studentId}-${subjectId}`;


export default function EnterMarks() {
  const { schoolId } = useParams();
  // MCDE opens a school's marks to correct them, including years the school has finished
  const isSuper = getSession().role === ROLES.SUPER_ADMIN;
  const marksApi = isSuper
    ? { students: listSchoolStudentsAsAdmin, list: listSchoolMarksAsAdmin, save: saveSchoolMarksAsAdmin }
    : { students: listAllSchoolStudents, list: listSchoolMarks, save: saveSchoolMarks };
  const school = useAsync(useCallback(() => (isSuper ? getSchool(schoolId) : Promise.resolve(null)), [isSuper, schoolId]));
  const scale = useGradingScale();

  // Students, subjects and years load once; marks reload when the year or term changes
  const lookups = useAsync(
    // Only current learners take marks (not those who left or completed Form 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- marksApi only changes with the role
    useCallback(() => Promise.all([marksApi.students(schoolId, { status: "Active" }), listSubjects(), listAcademicYears()]), [schoolId, isSuper])
  );
  // The school's current year and term (see Terms & Promotion) is where marks usually go
  const stage = useAsync(useCallback(() => getStage(schoolPromotionBase(isSuper, schoolId)).catch(() => null), [isSuper, schoolId]));
  const [currentStudents = [], subjects = [], years = []] = lookups.data || [];
  // Marks go into the active year or a past one, never an upcoming year
  const sortedYears = startedYears(years).sort((a, b) => b.year - a.year);
  const defaultYear =
    sortedYears.find((y) => y.id === stage.data?.academic_year_id) ||
    sortedYears.find((y) => y.status === "Active") ||
    sortedYears[0];

  const [yearChoice, setYearChoice] = useState("");
  const academicYearId = yearChoice || (defaultYear ? String(defaultYear.id) : "");
  const [termChoice, setTerm] = useState(null);
  const term = termChoice ?? stage.data?.term ?? 1;
  // A term the school has closed (a finished year, or an earlier term this year) has a
  // saved report, so it is locked for coordinators; only MCDE corrects it
  const selectedYear = sortedYears.find((y) => String(y.id) === academicYearId);
  const pastYear = Boolean(stage.data && selectedYear && selectedYear.year < stage.data.year);
  const closedTerm = Boolean(stage.data && selectedYear && selectedYear.id === stage.data.academic_year_id && term < stage.data.term);
  const closed = pastYear || closedTerm;
  const locked = closed && !isSuper;
  const [formLevel, setFormLevel] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // MCDE correcting a finished year sees who was at the school that year, in the form
  // they were in then (today's learners and forms would be wrong for a past year)
  const yearView = isSuper && pastYear;
  const saved = useAsync(
    useCallback(
      () => {
        if (!academicYearId) return Promise.resolve(null);
        if (yearView) return listSchoolYearMarksAsAdmin(schoolId, { academic_year_id: academicYearId, term });
        return formLevel
          ? marksApi.list(schoolId, { academic_year_id: academicYearId, term, form_level: formLevel }).then((marks) => ({ marks }))
          : Promise.resolve(null);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- marksApi only changes with the role
      [schoolId, academicYearId, term, yearView ? "" : formLevel, yearView, isSuper]
    )
  );
  const students = yearView ? saved.data?.learners || [] : currentStudents;
  const savedMarks = Object.fromEntries((saved.data?.marks || []).map((m) => [cellKey(m.student_id, m.subject_id), m.mark]));

  // Unsaved changes: key -> mark (0-100) or null when a saved mark was cleared
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });
  const dirtyCount = Object.keys(edits).length;

  const markFor = (studentId, subjectId) => {
    const key = cellKey(studentId, subjectId);
    return key in edits ? edits[key] : savedMarks[key];
  };

  // Changing the year, term or form discards unsaved marks, so ask first
  const changeFilter = (apply) => {
    if (dirtyCount && !window.confirm(`Discard ${dirtyCount} unsaved mark(s)?`)) return;
    setEdits({});
    apply();
  };

  const handleMarkChange = (studentId, subjectId, value) => {
    const key = cellKey(studentId, subjectId);
    const parsed = value === "" ? null : Math.min(100, Math.max(0, parseInt(value, 10)));
    if (Number.isNaN(parsed)) return;
    setEdits((prev) => {
      const next = { ...prev };
      const original = savedMarks[key] ?? null;
      if (parsed === original) delete next[key];
      else next[key] = parsed;
      return next;
    });
  };

  const visibleStudents = formLevel
    ? students
        .filter((s) => s.form_level === Number(formLevel))
        .sort((a, b) => fullName(a).localeCompare(fullName(b)))
    : [];
  // Columns: subjects that at least one student in the form takes
  const takenSubjectIds = new Set(visibleStudents.flatMap((s) => s.subject_ids || []));
  const columns = subjects.filter(
    (sub) => takenSubjectIds.has(sub.id) && (!subjectFilter || sub.id === Number(subjectFilter))
  );
  const { page, pageCount, pageItems, setPage } = usePagination(visibleStudents, 15);

  const takes = (student, subjectId) => (student.subject_ids || []).includes(subjectId);
  const studentAverage = (student) =>
    average(columns.filter((sub) => takes(student, sub.id)).map((sub) => markFor(student.id, sub.id)));

  const save = async (entries, successMessage) => {
    if (!entries.length) return;
    setSaving(true);
    try {
      await marksApi.save(schoolId, {
        academic_year_id: Number(academicYearId),
        term,
        marks: entries.map(([key, mark]) => {
          const [studentId, subjectId] = key.split("-").map(Number);
          return { student_id: studentId, subject_id: subjectId, mark };
        }),
      });
      setEdits((prev) => {
        const next = { ...prev };
        entries.forEach(([key]) => delete next[key]);
        return next;
      });
      saved.reload();
      showToast(successMessage);
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const saveAll = () => save(Object.entries(edits), `Saved ${dirtyCount} mark(s).`);
  const saveRow = (student) =>
    save(
      Object.entries(edits).filter(([key]) => key.startsWith(`${student.id}-`)),
      `Saved marks for ${fullName(student)}.`
    );

  // Summary for the visible form and subjects, including unsaved changes
  const enteredMarks = visibleStudents.flatMap((s) =>
    columns.filter((sub) => takes(s, sub.id)).map((sub) => markFor(s.id, sub.id)).filter((m) => m != null)
  );
  const subjectSummaries = columns.map((sub) => {
    const values = visibleStudents
      .filter((s) => takes(s, sub.id))
      .map((s) => markFor(s.id, sub.id))
      .filter((m) => m != null);
    return {
      ...sub,
      count: values.length,
      average: average(values),
      passRate: passRate(values, scale),
    };
  });

  const yearLabel = years.find((y) => String(y.id) === academicYearId)?.year;

  return (
    <Page
      icon="bi-pencil-square"
      title={isSuper ? `Marks: ${school.data?.name || "school"}` : "Enter Marks"}
      subtitle={
        isSuper
          ? "Correct a school's marks, including years it has finished. Corrections to a finished year are recorded in the audit log."
          : "Record each student's mark (0-100) per subject for an academic year and term."
      }
      actions={
        <>
          {isSuper && (
            <Button variant="ghost" icon="bi-arrow-left" to={`/admin/promotion/${schoolId}`}>
              Back to the school
            </Button>
          )}
          <Button variant="ghost" icon="bi-save" onClick={saveAll} disabled={!dirtyCount || saving || locked}>
            {saving ? "Saving…" : `Save all${dirtyCount ? ` (${dirtyCount})` : ""}`}
          </Button>
        </>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <DataState loading={lookups.loading} error={lookups.error} onRetry={lookups.reload}>
        {!defaultYear ? (
          <Notice tone="amber">No academic years have been set up yet, so marks cannot be recorded.</Notice>
        ) : (
          <>
            {locked && (
              <Notice tone="blue">
                {pastYear ? `The school has finished ${selectedYear.year}` : `Term ${term} of ${selectedYear.year} has closed`}, so
                its marks are view-only. If a mark is wrong, ask MCDE (the Learner Support Manager) to correct it.
              </Notice>
            )}
            {isSuper && closed && (
              <Notice tone="amber">
                You are correcting {pastYear ? `${selectedYear.year}, a year this school has finished` : `Term ${term} of ${selectedYear.year}, which this school has closed`}.
                Each change is recorded in the activity log, and the term&apos;s saved report will show that marks changed.
              </Notice>
            )}
            <Card accent="blue" icon="bi-funnel" title="Class and Term" subtitle="Choose what to record marks for">
              <div className="ui-grid ui-cols-4">
                <Field label="Academic Year">
                  <Select value={academicYearId} onChange={(e) => changeFilter(() => setYearChoice(e.target.value))}>
                    {sortedYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year}
                        {y.status === "Active" ? " (active)" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Term">
                  <Segmented
                    options={TERM_OPTIONS.map((o) => {
                      // Not a term the school has not reached yet
                      const ahead = stage.data && String(stage.data.academic_year_id) === academicYearId && o.value > stage.data.term;
                      return ahead ? { ...o, disabled: true, title: `The school is in Term ${stage.data.term}` } : o;
                    })}
                    value={term}
                    onChange={(t) => term !== t && changeFilter(() => setTerm(t))}
                  />
                </Field>
                <Field label="Form">
                  <Select value={formLevel} onChange={(e) => changeFilter(() => setFormLevel(e.target.value))}>
                    <option value="">Select a form…</option>
                    {FORMS.map((f) => (
                      <option key={f} value={f}>
                        Form {f} ({students.filter((s) => s.form_level === f).length} students)
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Subject">
                  <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="">All subjects</option>
                    {subjects
                      .filter((sub) => takenSubjectIds.has(sub.id))
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                  </Select>
                </Field>
              </div>
            </Card>

            {!formLevel ? (
              <Notice tone="blue">Select a form to enter marks.</Notice>
            ) : (
              <>
                <Card
                  accent="green"
                  icon="bi-grid-3x3-gap"
                  title={`Form ${formLevel} · ${yearLabel} · Term ${term}`}
                  subtitle={`${visibleStudents.length} students · ${columns.length} subjects`}
                  actions={dirtyCount > 0 && <Badge tone="amber">{dirtyCount} unsaved</Badge>}
                  flush
                >
                  <DataState
                    loading={saved.loading}
                    error={saved.error}
                    onRetry={saved.reload}
                    empty={visibleStudents.length === 0 || columns.length === 0}
                    emptyMessage={
                      visibleStudents.length === 0
                        ? "No students are enrolled in this form."
                        : "Students in this form are not registered for any subjects yet."
                    }
                  >
                    <Table>
                      <thead>
                        <tr>
                          <th className={styles.studentCol}>Student</th>
                          {columns.map((sub) => (
                            <th key={sub.id} className={`center ${styles.subjectCol}`}>{sub.name}</th>
                          ))}
                          <th className="center">Average</th>
                          <th className="end">Save</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((student) => {
                          const avg = studentAverage(student);
                          const rowDirty = Object.keys(edits).some((key) => key.startsWith(`${student.id}-`));
                          return (
                            <tr key={student.id}>
                              <td>
                                <Person name={fullName(student)} sub={student.student_number} />
                              </td>
                              {columns.map((sub) => {
                                if (!takes(student, sub.id)) {
                                  return <td key={sub.id} className={styles.notTaken}>—</td>;
                                }
                                const key = cellKey(student.id, sub.id);
                                const mark = markFor(student.id, sub.id);
                                return (
                                  <td key={sub.id} className={styles.markCell}>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      aria-label={`${sub.name} mark for ${fullName(student)}`}
                                      className={`${styles.markInput} ${key in edits ? styles.dirty : ""}`}
                                      value={mark ?? ""}
                                      disabled={locked}
                                      onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                                    />
                                    <div className={styles.grade}>
                                      <GradeBadge mark={mark} />
                                    </div>
                                  </td>
                                );
                              })}
                              <td className={styles.markCell}>
                                <div className={styles.average}>{formatMark(avg)}</div>
                                <GradeBadge mark={avg} />
                              </td>
                              <td className="end">
                                <IconButton
                                  kind="save"
                                  title={`Save marks for ${fullName(student)}`}
                                  onClick={() => saveRow(student)}
                                  disabled={!rowDirty || saving || locked}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
                  </DataState>
                </Card>

                {enteredMarks.length > 0 && (
                  <>
                    <div className={`ui-grid ${styles.summaryTiles}`}>
                      <StatTile label="Marks entered" value={enteredMarks.length} icon="bi-pencil" tone="blue" />
                      <StatTile label="Average" value={formatMark(average(enteredMarks))} icon="bi-bar-chart" tone="purple" />
                      <StatTile label="Highest" value={Math.max(...enteredMarks)} icon="bi-arrow-up-circle" tone="green" />
                      <StatTile label="Lowest" value={Math.min(...enteredMarks)} icon="bi-arrow-down-circle" tone="red" />
                      <StatTile
                        label={scale ? `Pass rate (≥ ${scale.passMark})` : "Pass rate"}
                        value={scale ? `${passRate(enteredMarks, scale).toFixed(1)}%` : "-"}
                        icon="bi-check2-circle"
                        tone="amber"
                      />
                    </div>

                    <Card accent="purple" icon="bi-clipboard-data" title="Summary by Subject" subtitle="Includes unsaved changes" flush>
                      <Table compact>
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th className="num">Marks entered</th>
                            <th className="num">Average</th>
                            <th className="num">Pass rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjectSummaries.map((sub) => (
                            <tr key={sub.id}>
                              <td className="strong">{sub.name}</td>
                              <td className="num">{sub.count}</td>
                              <td className="num">{formatMark(sub.average)}</td>
                              <td className="num">{sub.passRate == null ? "-" : `${sub.passRate.toFixed(1)}%`}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card>
                  </>
                )}
              </>
            )}
          </>
        )}
      </DataState>
    </Page>
  );
}
