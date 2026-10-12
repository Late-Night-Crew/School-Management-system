import { useState, useEffect } from "react";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import { listDistricts } from "../../api/districts";
import { createStudent, deleteStudent, listStudents, updateStudent } from "../../api/students";
import { listAcademicYears } from "../../api/academicYears";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import TypeToConfirm from "../../components/TypeToConfirm";
import TablePagination from "../../components/TablePagination";
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
  Page,
  Person,
  SearchInput,
  Select,
  Table,
} from "../../components/ui";

const STATUS_TONES = { active: "green", inactive: "slate", graduated: "blue", transferred: "amber", pending: "purple" };

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [allYears, setAllYears] = useState([]);
  const [deleting, setDeleting] = useState(null);

  const studentsPerPage = 5;

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
      const [divData, schoolData, districtData, studentData, academicData] = await Promise.all([
        listRegions(),
        listSchools(),
        listDistricts(),
        listStudents(),
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

      const mappedStudents = (studentData || []).map((s) => {
        const school = schoolData.find((sc) => Number(sc.id) === Number(s.school_id));
        const district = districtData.find((d) => Number(d.id) === Number(school?.district_id));
        const division = divData.find((div) => Number(div.id) === Number(district?.region_id));

        return {
          ...s,
          studentNumber: s.student_number,
          firstName: s.first_name,
          lastName: s.last_name,
          formLevel: s.form_level,
          gender: s.gender,
          schoolName: school?.name || "",
          districtName: district?.name || "",
          divisionName: division?.name || "",
          status: s.status || "Active",
        };
      });

      setStudents(mappedStudents);
      setFilteredStudents(mappedStudents);
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

  // Search & filter logic
  useEffect(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    const filtered = students.filter((s) => {
      const matchSearch =
        !lowerSearch ||
        s.firstName.toLowerCase().includes(lowerSearch) ||
        s.lastName.toLowerCase().includes(lowerSearch) ||
        s.studentNumber.toLowerCase().includes(lowerSearch);

      const matchDivision =
        !selectedDivision ||
        s.divisionName === divisions.find((d) => d.id === Number(selectedDivision))?.name;

      const matchDistrict =
        !selectedDistrict ||
        s.districtName === districts.find((d) => d.id === Number(selectedDistrict))?.name;

      const matchSchool =
        !selectedSchool ||
        s.schoolName === schools.find((sch) => sch.id === Number(selectedSchool))?.name;

      return matchSearch && matchDivision && matchDistrict && matchSchool;
    });

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedDivision, selectedDistrict, selectedSchool, students, divisions, districts, schools]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Export to Excel
  const exportToExcel = () => {
    if (filteredStudents.length === 0) return alert("No students to export!");

    const data = filteredStudents.map((s) => ({
      "Student #": s.studentNumber,
      "First Name": s.firstName,
      "Last Name": s.lastName,
      "Form Level": s.formLevel,
      "Gender": s.gender,
      "School": s.schoolName,
      "District": s.districtName,
      "Division": s.divisionName,
      "Status": s.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Students_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
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
      fetchAllData();
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
      fetchAllData();
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
      subtitle="Every enrolled student nationally, filterable by division, district and school."
      stats={[{ label: "Students", value: formatNumber(students.length) }]}
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
          <Button variant="success" size="sm" icon="bi-file-earmark-excel" onClick={exportToExcel}>
            Export Excel
          </Button>
        }
      >
        <div className="ui-grid ui-cols-3">
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
        </div>
      </Card>

      <Card
        accent="blue"
        icon="bi-people-fill"
        title="All Students"
        subtitle={`${formatNumber(filteredStudents.length)} of ${formatNumber(students.length)} shown`}
        actions={
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search name or number…" />
        }
        flush
      >
        {currentStudents.length === 0 ? (
          <EmptyState icon="bi-people">No students found.</EmptyState>
        ) : (
          <>
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
                {currentStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Person name={`${s.firstName} ${s.lastName}`} sub={s.studentNumber} />
                    </td>
                    <td>Form {s.formLevel}</td>
                    <td>{s.gender}</td>
                    <td>{s.schoolName}</td>
                    <td>{s.districtName}</td>
                    <td>{s.divisionName}</td>
                    <td>
                      <Badge tone={STATUS_TONES[s.status.toLowerCase()] || "slate"}>{s.status}</Badge>
                    </td>
                    <td className="end">
                      <IconButton kind="edit" title="Edit student" onClick={() => openEditModal(s)} />
                      <IconButton kind="delete" title="Delete student" onClick={() => setDeleting(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <TablePagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
          </>
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
          <Field label="Status" required>
            <Select name="status" value={newStudent.status} onChange={handleNewStudentChange} required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </Select>
          </Field>
        </div>
      </Dialog>

      <TypeToConfirm
        show={!!deleting}
        onHide={() => setDeleting(null)}
        onConfirm={handleDeleteStudent}
        name={deleting ? `${deleting.first_name} ${deleting.last_name}` : ""}
        title="Delete Student"
        confirmLabel="Delete student"
      >
        Deleting <strong>{deleting?.first_name} {deleting?.last_name}</strong> permanently erases their marks, subject
        choices and transfer history. If the student has moved to another school, transfer them instead.
      </TypeToConfirm>
    </Page>
  );
};

export default ManageStudents;
