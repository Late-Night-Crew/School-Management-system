import { useState, useEffect } from "react";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import { listDistricts } from "../../api/districts";
import {
  createStudent,
  deleteStudent,
  findSimilarStudents,
  listStudents,
  markStudentLeft,
  reinstateStudent,
  updateStudent,
} from "../../api/students";
import { LeaveDialog, LearnerStatusBadge, ReinstateDialog } from "../../components/LearnerStatus";
import DuplicateLearnerDialog from "../../components/DuplicateLearnerDialog";
import { listAcademicYears } from "../../api/academicYears";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import TypeToConfirm from "../../components/TypeToConfirm";
import TablePagination from "../../components/TablePagination";
import useServerPage, { fetchAllPages } from "../../hooks/useServerPage";
import { FORMS, LEARNER_SHOWS, learnerSheetRows } from "../../utils/learners";
import { formatNumber } from "../../utils/format";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Notice,
  Page,
  Person,
  SearchInput,
  Segmented,
  Select,
  Table,
} from "../../components/ui";


const ManageStudents = () => {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("Active");
  const [form, setForm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [allYears, setAllYears] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const [reinstating, setReinstating] = useState(null);
  const [duplicates, setDuplicates] = useState(null); // { matches, fields } awaiting confirmation

  // Learners are paged and filtered on the server
  const list = useServerPage(
    listStudents,
    { region_id: selectedDivision, district_id: selectedDistrict, school_id: selectedSchool, status, form_level: form },
    searchTerm
  );
  const refresh = list.reload;

  const [newStudent, setNewStudent] = useState({
    student_number: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    previous_school: "",
    guardian_name: "",
    form_level: 1,
    status: "active",
    school_id: "",
    academic_year_id: "",
  });

  const fetchAllData = async () => {
    try {
      const [divData, schoolData, districtData, academicData] = await Promise.all([
        listRegions(),
        listSchools(),
        listDistricts(),
        listAcademicYears(),
      ]);

      setDivisions(divData || []);
      setSchools(schoolData || []);
      setDistricts(districtData || []);

      // ✅ Filter active academic years and auto-select one
      const activeYears = (academicData || []).filter(
        (a) => a.status?.toLowerCase() === "active"
      );
      setAcademicYears(activeYears);
      setAllYears(academicData || []);

      // If there’s at least one active academic year, set it by default
      if (activeYears.length > 0) {
        setNewStudent((prev) => ({
          ...prev,
          academic_year_id: activeYears[0].id.toString(),
        }));
      }

    } catch (err) {
      console.error("Error loading data:", err);
      alert(`Failed to load students: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter districts and schools dynamically
  const filteredDistricts = selectedDivision
    ? districts.filter((d) => d.region_id === Number(selectedDivision))
    : districts;

  const filteredSchools = selectedDistrict
    ? schools.filter((s) => s.district_id === Number(selectedDistrict))
    : schools;


  // Export every learner matching the filters
  const exportToExcel = async () => {
    setExporting(true);
    setExportError("");
    try {
      const rows = learnerSheetRows(await fetchAllPages(listStudents, list.query));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([excelBuffer], { type: "application/octet-stream" }),
        `Students_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  // Handle new student form changes
  const handleNewStudentChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const blankStudent = () => ({
    student_number: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    previous_school: "",
    guardian_name: "",
    form_level: 1,
    status: "active",
    school_id: "",
    academic_year_id: academicYears.length > 0 ? academicYears[0].id.toString() : "",
    national_id: "",
    jce_number: "",
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setNewStudent(blankStudent());
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setNewStudent({
      student_number: student.student_number || "",
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      gender: student.gender || "",
      date_of_birth: student.date_of_birth ? student.date_of_birth.split("T")[0] : "",
      previous_school: student.previous_school || "",
      guardian_name: student.guardian_name || "",
      form_level: student.form_level || 1,
      status: student.status || "active",
      school_id: student.school_id ? String(student.school_id) : "",
      academic_year_id: student.academic_year_id ? String(student.academic_year_id) : "",
      national_id: student.national_id || "",
      jce_number: student.jce_number || "",
    });
    setShowModal(true);
  };

  // Add or update a student. An update replaces the whole record (including
  // subjects and guardian details), so start from the full existing student.
  const handleSaveStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.school_id || !newStudent.academic_year_id) {
      return alert("Please select a school and academic year.");
    }

    const fields = {
      ...newStudent,
      form_level: parseInt(newStudent.form_level, 10),
      school_id: parseInt(newStudent.school_id, 10),
      academic_year_id: parseInt(newStudent.academic_year_id, 10),
    };

    try {
      // Same name plus same date of birth or guardian phone: warn before saving
      const matches = await findSimilarStudents({
        first_name: fields.first_name,
        last_name: fields.last_name,
        date_of_birth: fields.date_of_birth,
        guardian_phone: editingStudent?.guardian_phone,
        exclude_id: editingStudent?.id,
      });
      if (matches.length) {
        setDuplicates({ matches, fields });
        return;
      }
      await saveStudent(fields);
    } catch (err) {
      alert(`Failed to save student: ${err.message}`);
    }
  };

  // Saves the student; called directly, or after the possible-duplicate warning
  const saveStudent = async (fields) => {
    setDuplicates(null);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, { ...editingStudent, ...fields });
        alert(`Student ${fields.first_name} ${fields.last_name} updated successfully!`);
      } else {
        await createStudent(fields);
        alert(`Student ${fields.first_name} ${fields.last_name} added successfully!`);
      }
      setShowModal(false);
      setEditingStudent(null);
      setNewStudent(blankStudent());
      refresh();
    } catch (err) {
      console.error("Error saving student:", err);
      alert(`Failed to save student: ${err.message}`);
    }
  };

  const handleDeleteStudent = async () => {
    const student = deleting;
    setDeleting(null);
    try {
      await deleteStudent(student.id);
      refresh();
    } catch (err) {
      alert(`Failed to delete student: ${err.message}`);
    }
  };

  // Active years, plus the edited student's own year if it is no longer active
  const yearOptions =
    editingStudent && !academicYears.some((y) => y.id === editingStudent.academic_year_id)
      ? [...academicYears, ...allYears.filter((y) => y.id === editingStudent.academic_year_id)]
      : academicYears;

  return (
    <Page
      icon="bi-mortarboard-fill"
      title="Student Management"
      subtitle="Every learner nationally, filterable by division, district, school, form and status."
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={openAddModal}>
          Add Student
        </Button>
      }
    >
      <Card
        accent="slate"
        icon="bi-funnel"
        title="Filters"
        subtitle="Narrow the list by area"
        actions={
          <Button variant="success" size="sm" icon="bi-file-earmark-excel" onClick={exportToExcel} disabled={!list.total || exporting}>
            {exporting ? "Preparing…" : "Export Excel"}
          </Button>
        }
      >
        <div className="ui-grid ui-cols-4">
          <Field label="Division">
            <Select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict("");
                setSelectedSchool("");
              }}
            >
              <option value="">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District">
            <Select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedSchool("");
              }}
              disabled={!selectedDivision}
            >
              <option value="">All Districts</option>
              {filteredDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="School">
            <Select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              disabled={!selectedDistrict}
            >
              <option value="">All Schools</option>
              {filteredSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Form">
            <Select value={form} onChange={(e) => setForm(e.target.value)}>
              <option value="">All Forms</option>
              {FORMS.map((f) => (
                <option key={f} value={f}>
                  Form {f}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {exportError && <Notice tone="red">{exportError}</Notice>}

      <Card
        accent="blue"
        icon="bi-people-fill"
        title="All Students"
        subtitle={list.firstLoad ? "Loading…" : `${formatNumber(list.total)} ${list.total === 1 ? "learner" : "learners"}`}
        actions={
          <>
            <Segmented options={LEARNER_SHOWS} value={status} onChange={setStatus} />
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Name, number or National ID…" />
          </>
        }
        flush
      >
        {list.error ? (
          <Notice tone="red">{list.error}</Notice>
        ) : list.items.length === 0 ? (
          <EmptyState icon="bi-people">{list.firstLoad ? "Loading…" : "No students found."}</EmptyState>
        ) : (
          <div style={{ opacity: list.refreshing ? 0.55 : 1, transition: "opacity 0.15s" }}>
            <Table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Form</th>
                  <th>Gender</th>
                  <th>School</th>
                  <th>District</th>
                  <th>Division</th>
                  <th>Status</th>
                  <th className="end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Person name={`${s.first_name} ${s.last_name}`} sub={s.student_number} />
                    </td>
                    <td>Form {s.form_level}</td>
                    <td>{s.gender}</td>
                    <td>{s.school_name}</td>
                    <td>{s.district_name}</td>
                    <td>{s.region_name}</td>
                    <td>
                      <LearnerStatusBadge student={s} />
                    </td>
                    <td className="end">
                      <IconButton kind="edit" title="Edit student" onClick={() => openEditModal(s)} />
                      {s.status === "Active" && (
                        <IconButton kind="view" icon="bi-box-arrow-right" title={`${s.first_name} ${s.last_name} has left`} tip="Learner has left" onClick={() => setLeaving(s)} />
                      )}
                      {(s.status === "Withdrawn" || s.status === "DroppedOut") && (
                        <IconButton kind="save" icon="bi-arrow-counterclockwise" title={`Reinstate ${s.first_name} ${s.last_name}`} tip="Reinstate" onClick={() => setReinstating(s)} />
                      )}
                      <IconButton kind="delete" title="Delete student" onClick={() => setDeleting(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <TablePagination page={list.page} pageCount={list.pageCount} onChange={list.setPage} />
          </div>
        )}
      </Card>

      <Dialog
        show={showModal}
        onHide={() => setShowModal(false)}
        title={editingStudent ? "Edit Student" : "Add New Student"}
        icon="bi-person-plus"
        size="lg"
        as="form"
        onSubmit={handleSaveStudent}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon="bi-check-lg">
              {editingStudent ? "Save Changes" : "Add Student"}
            </Button>
          </>
        }
      >
        <div className="ui-grid ui-cols-2">
          <Field label="Student Number" required>
            <Input name="student_number" value={newStudent.student_number} onChange={handleNewStudentChange} required />
          </Field>
          <Field label="Gender" required>
            <Select name="gender" value={newStudent.gender} onChange={handleNewStudentChange} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </Field>
          <Field label="First Name" required>
            <Input name="first_name" value={newStudent.first_name} onChange={handleNewStudentChange} required />
          </Field>
          <Field label="Last Name" required>
            <Input name="last_name" value={newStudent.last_name} onChange={handleNewStudentChange} required />
          </Field>
          <Field label="National ID" hint="8 letters and numbers; leave empty if the learner has none yet">
            <Input
              name="national_id"
              maxLength={8}
              value={newStudent.national_id}
              onChange={(e) => setNewStudent({ ...newStudent, national_id: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="JCE Number" hint="Given in Form 2">
            <Input
              name="jce_number"
              maxLength={30}
              value={newStudent.jce_number}
              onChange={(e) => setNewStudent({ ...newStudent, jce_number: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Date of Birth" required>
            <Input
              type="date"
              name="date_of_birth"
              value={newStudent.date_of_birth}
              onChange={handleNewStudentChange}
              required
            />
          </Field>
          <Field label="Form Level" required>
            <Input
              type="number"
              name="form_level"
              min="1"
              max="8"
              value={newStudent.form_level}
              onChange={handleNewStudentChange}
              required
            />
          </Field>
          <Field label="Previous School">
            <Input name="previous_school" value={newStudent.previous_school} onChange={handleNewStudentChange} />
          </Field>
          <Field label="Guardian Name">
            <Input name="guardian_name" value={newStudent.guardian_name} onChange={handleNewStudentChange} />
          </Field>
          <Field label="School" required>
            <Select name="school_id" value={newStudent.school_id} onChange={handleNewStudentChange} required>
              <option value="">Select School</option>
              {/* Closed schools take no new students; keep the student's own school listed */}
              {schools
                .filter((s) => !s.closed_at || String(s.id) === String(newStudent.school_id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.closed_at ? " (closed)" : ""}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Academic Year" required>
            <Select
              name="academic_year_id"
              value={newStudent.academic_year_id}
              onChange={handleNewStudentChange}
              required
            >
              <option value="">Select Active Academic Year</option>
              {yearOptions.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.year}
                </option>
              ))}
            </Select>
          </Field>

        </div>
      </Dialog>

      <LeaveDialog
        student={leaving}
        onHide={() => setLeaving(null)}
        markLeft={markStudentLeft}
        onDone={(message) => {
          setLeaving(null);
          alert(message);
          refresh();
        }}
      />
      <ReinstateDialog
        student={reinstating}
        onHide={() => setReinstating(null)}
        reinstate={reinstateStudent}
        onDone={(message) => {
          setReinstating(null);
          alert(message);
          refresh();
        }}
        onError={(message) => {
          setReinstating(null);
          alert(message);
        }}
      />

      <DuplicateLearnerDialog
        matches={duplicates?.matches}
        onCancel={() => setDuplicates(null)}
        onConfirm={() => saveStudent(duplicates.fields)}
      />

      <TypeToConfirm
        show={!!deleting}
        onHide={() => setDeleting(null)}
        onConfirm={handleDeleteStudent}
        name={deleting ? `${deleting.first_name} ${deleting.last_name}` : ""}
        title="Delete Student"
        confirmLabel="Delete student"
      >
        Delete <strong>{deleting?.first_name} {deleting?.last_name}</strong> only if they were registered by mistake. A
        learner with marks, results or transfers cannot be deleted: mark them as having left, or transfer them if they
        moved school. The delete is recorded in the activity log.
      </TypeToConfirm>
    </Page>
  );
};

export default ManageStudents;
