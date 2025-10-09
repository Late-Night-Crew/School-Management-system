import React, { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const stats = {
    totalStudents: 1200,
    forms: [
      { form: "Form 1", total: 300, males: 160, females: 140 },
      { form: "Form 2", total: 280, males: 150, females: 130 },
      { form: "Form 3", total: 310, males: 170, females: 140 },
      { form: "Form 4", total: 310, males: 155, females: 155 },
    ],
    universitySelected: { total: 250, males: 140, females: 110 },
  };

  // Generate mock student data
  const students = Array.from({ length: 42 }).map((_, i) => ({
    id: i + 1,
    firstName: `Student${i + 1}`,
    middleName: `M${i + 1}`,
    lastName: `L${i + 1}`,
    gender: i % 2 === 0 ? "Male" : "Female",
    class: `Form ${1 + (i % 4)}`,
  }));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  // Chart Data
  const chartData = stats.forms.map((f) => ({
    name: f.form,
    males: f.males,
    females: f.females,
  }));

  const COLORS = ["#007bff", "#ffc107", "#28a745", "#dc3545"];

  return (
    <div className="p-4">
      {/* ✅ Top Section */}
      <div className="container-fluid bg-primary text-white rounded-3 shadow-sm p-3 mb-4">
        <h2 className="text-center fw-bold">Admin Dashboard
        </h2>
        <p className="text-center mb-0">Overview of Students and School Statistics</p>
      </div>

      {/* ✅ Scrollable Section */}
      <section className="overflow-auto" style={{ maxHeight: "75vh", paddingBottom: "1rem" }}>
        <div className="container mb-4">
          <div className="row g-3">
            {/* Total Students */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center">
                  <h5 className="fw-bold text-primary">
                    <i className="bi bi-people-fill me-2"></i>Total Students
                  </h5>
                  <h2 className="fw-bolder">{stats.totalStudents}</h2>
                </div>
              </div>
            </div>

            {/* Forms */}
            {stats.forms.map((form, index) => (
              <div key={index} className="col-md-4">
                <div className="card shadow-sm border-0">
                  <div className="card-body text-center">
                    <h5 className="fw-bold text-secondary">
                      <i className="bi bi-book-fill me-2"></i>{form.form}
                    </h5>
                    <p className="mb-1 text-muted">
                      Total: <strong>{form.total}</strong>
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-gender-male text-primary me-1"></i>{form.males} |
                      <i className="bi bi-gender-female text-danger ms-2 me-1"></i>{form.females}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* University Selection */}
            <div className="col-md-4">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center">
                  <h5 className="fw-bold text-success">
                    <i className="bi bi-mortarboard-fill me-2"></i>Selected for University
                  </h5>
                  <p className="mb-1 text-muted">
                    Total: <strong>{stats.universitySelected.total}</strong>
                  </p>
                  <p className="mb-0">
                    <i className="bi bi-gender-male text-primary me-1"></i>
                    {stats.universitySelected.males} |
                    <i className="bi bi-gender-female text-danger ms-2 me-1"></i>
                    {stats.universitySelected.females}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Statistics Section */}
        <div className="container mb-5">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 p-3">
                <h5 className="text-center fw-bold text-primary mb-3">
                  <i className="bi bi-bar-chart-fill me-2"></i>Gender Distribution (Bar Chart)
                </h5>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="males" fill="#007bff" />
                    <Bar dataKey="females" fill="#e83e8c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 p-3">
                <h5 className="text-center fw-bold text-success mb-3">
                  <i className="bi bi-pie-chart-fill me-2"></i>Total Students by Form (Pie Chart)
                </h5>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.forms}
                      dataKey="total"
                      nameKey="form"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {stats.forms.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Student Table with Pagination */}
        <div className="container mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="fw-bold text-center text-primary mb-3">
                <i className="bi bi-table me-2"></i>Student List
              </h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead className="table-primary">
                    <tr>
                      <th>#</th>
                      <th>First Name</th>
                      <th>Middle Name</th>
                      <th>Last Name</th>
                      <th>Gender</th>
                      <th>Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.firstName}</td>
                        <td>{s.middleName}</td>
                        <td>{s.lastName}</td>
                        <td>{s.gender}</td>
                        <td>{s.class}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Buttons */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-outline-primary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <i className="bi bi-arrow-left-circle me-2"></i>Previous
                </button>

                <span className="fw-bold">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="btn btn-outline-primary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next<i className="bi bi-arrow-right-circle ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
