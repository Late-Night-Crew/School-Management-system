import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { fetchregions } from "../services/divisionService";
import { fetchSchools } from "../services/schoolService";
import { fetchDistricts } from "../services/districtService";
import { fetchStudents, createStudent } from "../services/studentService";
import { fetchacademics } from "../services/academicService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button, Form, Modal } from "react-bootstrap";

const Managestudents = () => {
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

  const getStatusBadgeClass = (status) => {
    const classes = {
      active: "bg-success",
      inactive: "bg-secondary",
      graduated: "bg-primary",
      transferred: "bg-warning",
    };
    return classes[status.toLowerCase()] || "bg-secondary";
  };

  const fetchAllData = async () => {
    try {
      const [divData, schoolData, districtData, studentData, academicData] = await Promise.all([
        fetchregions(),
        fetchSchools(),
        fetchDistricts(),
        fetchStudents(),
        fetchacademics(),
      ]);

      setDivisions(divData || []);
      setSchools(schoolData || []);
      setDistricts(districtData || []);

      // ✅ Filter active academic years and auto-select one
      const activeYears = (academicData || []).filter(
        (a) => a.status?.toLowerCase() === "active"
      );
      setAcademicYears(activeYears);

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

  // Submit new student
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.school_id || !newStudent.academic_year_id) {
      return alert("Please select a school and academic year.");
    }

    try {
      await createStudent({
        ...newStudent,
        form_level: parseInt(newStudent.form_level, 10),
        school_id: parseInt(newStudent.school_id, 10),
        academic_year_id: parseInt(newStudent.academic_year_id, 10),
      });

      alert(`Student ${newStudent.first_name} ${newStudent.last_name} added successfully!`);
      setShowModal(false);
      setNewStudent({
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
      fetchAllData();
    } catch (err) {
      console.error("Error adding student:", err);
      alert("Failed to add student.");
    }
  };

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <h1 className="display-6 fw-bold text-dark">
            <i className="bi bi-mortarboard-fill me-2" style={{ color: "#667eea", fontSize: "2.5rem" }}></i>
            Student Management
          </h1>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-circle me-1"></i> Add Student
          </Button>
        </div>

        {/* Filters */}
        <div className="card shadow-sm border-0 mb-4">
          <div
            className="card-header text-white"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            <h5 className="mb-0">
              <i className="bi bi-funnel me-2"></i> Filters
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label className="fw-semibold">Division</Form.Label>
                <Form.Select
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
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label className="fw-semibold">District</Form.Label>
                <Form.Select
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
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label className="fw-semibold">School</Form.Label>
                <Form.Select
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
                </Form.Select>
              </div>
              <div className="col-12 text-end mt-2">
                <Button variant="success" onClick={exportToExcel}>
                  <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Student Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add New Student</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddStudent}>
              <Form.Group className="mb-2">
                <Form.Label>Student Number</Form.Label>
                <Form.Control
                  type="text"
                  name="student_number"
                  value={newStudent.student_number}
                  onChange={handleNewStudentChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={newStudent.first_name}
                  onChange={handleNewStudentChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={newStudent.last_name}
                  onChange={handleNewStudentChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  name="gender"
                  value={newStudent.gender}
                  onChange={handleNewStudentChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  name="date_of_birth"
                  value={newStudent.date_of_birth}
                  onChange={handleNewStudentChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Previous School</Form.Label>
                <Form.Control
                  type="text"
                  name="previous_school"
                  value={newStudent.previous_school}
                  onChange={handleNewStudentChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Guardian Name</Form.Label>
                <Form.Control
                  type="text"
                  name="guardian_name"
                  value={newStudent.guardian_name}
                  onChange={handleNewStudentChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Form Level</Form.Label>
                <Form.Control
                  type="number"
                  name="form_level"
                  min="1"
                  max="8"
                  value={newStudent.form_level}
                  onChange={handleNewStudentChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>School</Form.Label>
                <Form.Select
                  name="school_id"
                  value={newStudent.school_id}
                  onChange={handleNewStudentChange}
                  required
                >
                  <option value="">Select School</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Academic Year</Form.Label>
                <Form.Select
                  name="academic_year_id"
                  value={newStudent.academic_year_id}
                  onChange={handleNewStudentChange}
                  required
                >
                  <option value="">Select Active Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={newStudent.status}
                  onChange={handleNewStudentChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
              <div className="text-end mt-3">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add Student
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Students Table */}
        <div className="card shadow-sm border-0">
          <div
            className="card-header text-white"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            <h5 className="mb-0">
              <i className="bi bi-people-fill me-2"></i> All Students
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6 position-relative">
                <i
                  className="bi bi-search position-absolute"
                  style={{
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                ></i>
                <Form.Control
                  type="text"
                  placeholder="Search by name or student number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "2rem", borderRadius: "25px" }}
                />
              </div>
              <div className="col-md-6 text-end">
                <span className="badge bg-primary fs-6">
                  Total Students: {filteredStudents.length}
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Student #</th>
                    <th>Name</th>
                    <th>Form</th>
                    <th>Gender</th>
                    <th>School</th>
                    <th>District</th>
                    <th>Division</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((s) => (
                      <tr key={s.id}>
                        <td>{s.studentNumber}</td>
                        <td>
                          {s.firstName} {s.lastName}
                        </td>
                        <td>Form {s.formLevel}</td>
                        <td>{s.gender}</td>
                        <td>{s.schoolName}</td>
                        <td>{s.districtName}</td>
                        <td>{s.divisionName}</td>
                        <td>
                          <span
                            className={`badge ${getStatusBadgeClass(s.status)}`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted">
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <nav>
                  <ul className="pagination">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item ${currentPage === i + 1 ? "active" : ""
                          }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Managestudents;
