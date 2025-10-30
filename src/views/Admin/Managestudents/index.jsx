import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { fetchregions } from "../services/divisionService";
import { fetchSchools } from "../services/schoolService";
import { fetchDistricts } from "../services/districtService";
import { fetchStudents } from "../services/studentService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button, Form } from "react-bootstrap";

const Managestudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [schools, setSchools] = useState([]);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [divData, schoolData, districtData, studentData] = await Promise.all([
          fetchregions(),
          fetchSchools(),
          fetchDistricts(),
          fetchStudents(),
        ]);

        setDivisions(divData || []);
        setSchools(schoolData || []);
        setDistricts(districtData || []);

        const mappedStudents = (studentData || []).map((s) => {
          const school = schoolData.find(sc => Number(sc.id) === Number(s.school_id));
          const district = districtData.find(d => Number(d.id) === Number(school?.district_id));
          const division = divData.find(div => Number(div.id) === Number(district?.region_id));

          return {
            ...s,
            studentNumber: s.student_number,
            firstName: s.first_name,
            lastName: s.last_name,
            formLevel: s.form_level,
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

    loadData();
  }, []);

  // Dynamic filtered districts & schools
  const filteredDistricts = selectedDivision
    ? districts.filter(d => d.region_id === Number(selectedDivision))
    : districts;

  const filteredSchools = selectedDistrict
    ? schools.filter(s => s.district_id === Number(selectedDistrict))
    : schools;

  // Filters & search
  useEffect(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    const filtered = students.filter((s) => {
      const matchSearch =
        !lowerSearch ||
        s.firstName.toLowerCase().includes(lowerSearch) ||
        s.lastName.toLowerCase().includes(lowerSearch) ||
        s.studentNumber.toLowerCase().includes(lowerSearch);

      const matchDivision = !selectedDivision || s.divisionName === divisions.find(d => d.id === Number(selectedDivision))?.name;
      const matchDistrict = !selectedDistrict || s.districtName === districts.find(d => d.id === Number(selectedDistrict))?.name;
      const matchSchool = !selectedSchool || s.schoolName === schools.find(sch => sch.id === Number(selectedSchool))?.name;

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

  const getStatusBadgeClass = (status) => {
    const classes = { Active: "bg-success", Inactive: "bg-secondary", Graduated: "bg-primary", Transferred: "bg-warning" };
    return classes[status] || "bg-secondary";
  };

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
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Students_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <h1 className="display-6 fw-bold text-dark">
            <i className="bi bi-mortarboard-fill me-2" style={{ color: "#667eea", fontSize: "2.5rem" }}></i>
            Student Management
          </h1>
        </div>

        {/* Filters */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i> Filters</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Label className="fw-semibold">Division</Form.Label>
                <Form.Select value={selectedDivision} onChange={(e) => { setSelectedDivision(e.target.value); setSelectedDistrict(""); setSelectedSchool(""); }}>
                  <option value="">All Divisions</option>
                  {divisions.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label className="fw-semibold">District</Form.Label>
                <Form.Select value={selectedDistrict} onChange={(e) => { setSelectedDistrict(e.target.value); setSelectedSchool(""); }} disabled={!selectedDivision}>
                  <option value="">All Districts</option>
                  {filteredDistricts.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Label className="fw-semibold">School</Form.Label>
                <Form.Select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} disabled={!selectedDistrict}>
                  <option value="">All Schools</option>
                  {filteredSchools.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Form.Select>
              </div>
              <div className="col-12 text-end mt-2">
                <Button variant="success" onClick={exportToExcel}><i className="bi bi-file-earmark-excel me-1"></i> Export Excel</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <h5 className="mb-0"><i className="bi bi-people-fill me-2"></i> All Students</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6 position-relative">
                <i className="bi bi-search position-absolute" style={{ left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }}></i>
                <Form.Control
                  type="text"
                  placeholder="Search by name or student number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "2rem", borderRadius: "25px" }}
                />
              </div>
              <div className="col-md-6 text-end">
                <span className="badge bg-primary fs-6">Total Students: {filteredStudents.length}</span>
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
                  {currentStudents.length > 0 ? currentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentNumber}</td>
                      <td>{s.firstName} {s.lastName}</td>
                      <td>Form {s.formLevel}</td>
                      <td>{s.gender}</td>
                      <td>{s.schoolName}</td>
                      <td>{s.districtName}</td>
                      <td>{s.divisionName}</td>
                      <td><span className={`badge ${getStatusBadgeClass(s.status)} rounded-pill`}>{s.status}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav>
                <ul className="pagination justify-content-center mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>Previous</button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(index + 1)}>{index + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>Next</button>
                  </li>
                </ul>
              </nav>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Managestudents;
