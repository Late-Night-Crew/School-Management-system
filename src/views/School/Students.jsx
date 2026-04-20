import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SchoolStudentService from "./services/studentService";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Students() {
  const { schoolId } = useParams();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const studentsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, [schoolId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await SchoolStudentService.fetchStudentsForSchool(schoolId);
      // Filter to ensure only this school's students (safety check)
      const filteredBySchool = data.filter(student => student.school_id === parseInt(schoolId));
      setStudents(filteredBySchool);
    } catch (error) {
      setError("Error fetching students: " + error.message);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_number?.includes(searchTerm)
  );

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchStudents}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Students</h2>
        <div className="input-group" style={{ width: "300px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or student number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button className="btn btn-outline-secondary" type="button">
            <i className="bi bi-search"></i>
          </button>
        </div>
      </div>

      {paginatedStudents.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Student Number</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Form Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, index) => (
                  <tr key={student.id || index}>
                    <td>{student.student_number || "N/A"}</td>
                    <td>{student.first_name || ""}</td>
                    <td>{student.last_name || ""}</td>
                    <td>{student.gender || ""}</td>
                    <td>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "N/A"}</td>
                    <td>{student.form_level || "N/A"}</td>
                    <td>
                      <span className={`badge ${student.status === "active" ? "bg-success" : "bg-secondary"}`}>
                        {student.status || "N/A"}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-info me-2">
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-warning">
                        <i className="bi bi-pencil"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li
                    key={page}
                    className={`page-item ${currentPage === page ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      ) : (
        <div className="alert alert-info">No students found</div>
      )}

      <div className="mt-3 text-muted">
        Total: {filteredStudents.length} students
        {searchTerm && ` (filtered from ${students.length})`}
      </div>
    </div>
  );
}
