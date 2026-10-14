import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { listAcademicYears } from "../../api/academicYears";
import { listSchoolMarks, listAllSchoolStudents, markSchoolStudentLeft, reinstateSchoolStudent } from "../../api/schoolPortal";
import { LeaveDialog, LearnerStatusBadge, ReinstateDialog } from "../../components/LearnerStatus";
import ToastNote from "../../components/ToastNote";
import { listSubjects } from "../../api/subjects";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { formatDate, fullName } from "../../utils/format";
import { average, formatMark } from "../../utils/grades";
import DataState from "../../components/DataState";
import GradeBadge from "../../components/GradeBadge";
import DetailRow from "../../components/DetailRow";
import LearnerProgress from "../../components/LearnerProgress";
import { schoolPromotionBase } from "../../api/promotion";
import TablePagination from "../../components/TablePagination";
import { Badge, Button, Card, Dialog, IconButton, Page, Person, SearchInput, Segmented, Table } from "../../components/ui";

const SHOW = [
  { value: "current", label: "Current" },
  { value: "left", label: "Left" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];
const inView = (student, show) =>
  show === "all" ||
  (show === "current" && student.status === "Active") ||
  (show === "left" && (student.status === "Withdrawn" || student.status === "DroppedOut")) ||
  (show === "completed" && student.status === "Completed");


// A student's details and their marks per subject, grouped by academic year and term.
function StudentDetails({ schoolId, student, subjects, years }) {
  const marks = useAsync(useCallback(() => listSchoolMarks(schoolId, { student_id: student.id }), [schoolId, student.id]));

  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || `Subject #${id}`;
  const yearOf = (id) => years.find((y) => y.id === id);
  const studentSubjects = (student.subject_ids || []).map(subjectName);

  // "yearId-term" -> marks, newest year first
  const periods = {};
  (marks.data || []).forEach((m) => {
    (periods[`${m.academic_year_id}-${m.term}`] ??= []).push(m);
  });
  const periodKeys = Object.keys(periods).sort((a, b) => {
    const [yearA, termA] = a.split("-").map(Number);
    const [yearB, termB] = b.split("-").map(Number);
    return (yearOf(yearB)?.year || 0) - (yearOf(yearA)?.year || 0) || termA - termB;
  });

  return (
    <div className="ui-grid">
      <div>
        <DetailRow label="Student Number" value={student.student_number} />
        <DetailRow label="Gender" value={student.gender} />
        <DetailRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
        <DetailRow label="Form" value={student.form_level && `Form ${student.form_level}`} />
        <DetailRow label="Status" value={student.status} />
        <DetailRow label="Guardian" value={[student.guardian_name, student.guardian_phone].filter(Boolean).join(" · ")} />
        <DetailRow label="Disability" value={student.disability ? student.disability_details || "Yes" : "No"} />
        <DetailRow label="Subjects" value={studentSubjects.join(", ")} />
      </div>

      <LearnerProgress base={schoolPromotionBase(false, schoolId)} studentId={student.id} />

      <Card accent="amber" icon="bi-journal-check" title="Marks" subtitle="By academic year and term" flush>
        <DataState
          loading={marks.loading}
          error={marks.error}
          onRetry={marks.reload}
          empty={periodKeys.length === 0}
          emptyMessage="No marks recorded yet."
        >
          {periodKeys.map((key) => {
            const [yearId, term] = key.split("-").map(Number);
            const periodMarks = periods[key];
            const avg = average(periodMarks.map((m) => m.mark));
            return (
              <Table compact key={key}>
                <thead>
                  <tr>
                    <th>{yearOf(yearId)?.year || `Year #${yearId}`} · Term {term}</th>
                    <th className="num">Mark</th>
                    <th className="end">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {periodMarks.map((m) => (
                    <tr key={m.id}>
                      <td className="strong">{subjectName(m.subject_id)}</td>
                      <td className="num">{m.mark}</td>
                      <td className="end">
                        <GradeBadge mark={m.mark} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Average</td>
                    <td className="num">{formatMark(avg)}</td>
                    <td className="end">
                      <GradeBadge mark={avg} />
                    </td>
                  </tr>
                </tfoot>
              </Table>
            );
          })}
        </DataState>
      </Card>
    </div>
  );
}

export default function SchoolStudents() {
  const { schoolId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewing, setViewing] = useState(null);
  const [show, setShow] = useState("current");
  const [leaving, setLeaving] = useState(null);
  const [reinstating, setReinstating] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const notify = (message, variant = "success") => setToast({ show: true, message, variant });

  const data = useAsync(
    useCallback(() => Promise.all([listAllSchoolStudents(schoolId), listSubjects(), listAcademicYears()]), [schoolId])
  );
  const [students = [], subjects = [], years = []] = data.data || [];

  const term = searchTerm.trim().toLowerCase();
  const filteredStudents = students.filter(
    (s) => inView(s, show) && (fullName(s).toLowerCase().includes(term) || s.student_number?.toLowerCase().includes(term))
  );
  const current = students.filter((s) => s.status === "Active").length;
  const { page, pageCount, pageItems, setPage } = usePagination(filteredStudents, 10);

  return (
    <Page
      icon="bi-people-fill"
      title="Students"
      subtitle="Learners at your school: current ones, those who left, and those who completed Form 4."
      stats={[
        { label: "Current", value: data.loading ? null : current },
        { label: "Left", value: data.loading ? null : students.filter((s) => inView(s, "left")).length },
      ]}
      actions={
        <Button variant="ghost" icon="bi-person-plus" to={`/school/${schoolId}/register`}>
          Register Student
        </Button>
      }
    >
      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Students"
        subtitle={`${filteredStudents.length} of ${students.length} students`}
        actions={
          <>
            <Segmented options={SHOW} value={show} onChange={setShow} />
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search name or number…" />
          </>
        }
        flush
      >
        <DataState
          loading={data.loading}
          error={data.error}
          onRetry={data.reload}
          empty={filteredStudents.length === 0}
          emptyMessage={searchTerm ? "No students match your search." : show === "current" ? "No current learners." : "No learners here."}
        >
          <Table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Form</th>
                <th>Status</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((student) => (
                <tr key={student.id}>
                  <td>
                    <Person name={fullName(student)} sub={student.student_number} />
                  </td>
                  <td>{student.gender || "-"}</td>
                  <td>{formatDate(student.date_of_birth)}</td>
                  <td>{student.form_level ? <Badge tone="blue">Form {student.form_level}</Badge> : "-"}</td>
                  <td>
                    <LearnerStatusBadge student={student} />
                  </td>
                  <td className="end">
                    <IconButton kind="view" title="View details and marks" onClick={() => setViewing(student)} />
                    <IconButton kind="edit" title="Edit student" to={`/school/${schoolId}/register?edit=${student.id}`} />
                    {student.status === "Active" && (
                      <IconButton kind="delete" icon="bi-box-arrow-right" title={`${fullName(student)} has left`} tip="Learner has left" onClick={() => setLeaving(student)} />
                    )}
                    {(student.status === "Withdrawn" || student.status === "DroppedOut") && (
                      <IconButton kind="save" icon="bi-arrow-counterclockwise" title={`Reinstate ${fullName(student)}`} tip="Reinstate" onClick={() => setReinstating(student)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
        </DataState>
      </Card>

      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <LeaveDialog
        student={leaving}
        onHide={() => setLeaving(null)}
        markLeft={(id, leave) => markSchoolStudentLeft(schoolId, id, leave)}
        onDone={(message) => {
          setLeaving(null);
          notify(message);
          data.reload();
        }}
      />
      <ReinstateDialog
        student={reinstating}
        onHide={() => setReinstating(null)}
        reinstate={(id) => reinstateSchoolStudent(schoolId, id)}
        onDone={(message) => {
          setReinstating(null);
          notify(message);
          data.reload();
        }}
        onError={(message) => {
          setReinstating(null);
          notify(message, "danger");
        }}
      />

      <Dialog show={!!viewing} onHide={() => setViewing(null)} title={viewing && fullName(viewing)} icon="bi-person-vcard" size="lg">
        {viewing && <StudentDetails schoolId={schoolId} student={viewing} subjects={subjects} years={years} />}
      </Dialog>
    </Page>
  );
}
