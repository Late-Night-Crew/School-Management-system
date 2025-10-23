import React, { useState } from "react";

export default function AdminDashboard() {
  const stats = {
    totalStudents: 1200,
    studentsWithDisabilities: 45,
    totalSchoolManagers: 60,
    totalDivisionManagers: 3,
    totalDistricts: 28,
    totalSchools: 750,
  };

  // Mock announcements
  const announcements = [
    { id: 1, title: "National Examination Schedule Released", date: "2025-10-15" },
    { id: 2, title: "New Education Policy on STEM Promotion", date: "2025-10-12" },
    { id: 3, title: "Teacher Training Workshop Announced", date: "2025-10-08" },
  ];

  // Mock recent activities
  const recentActivities = [
    { id: 1, actor: "Southern Division Admin", action: "Approved 2 new schools", time: "2 hrs ago" },
    { id: 2, actor: "Mzuzu School Manager", action: "Uploaded student performance report", time: "5 hrs ago" },
    { id: 3, actor: "Central Division Admin", action: "Updated teacher records", time: "Yesterday" },
  ];

  // Mock student data
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

  return (
    <div className="p-4">
      {/* Top Header */}
      <div className="container-fluid bg-primary text-white rounded-3 shadow-sm p-2 mb-3">
        <h4 className="text-center fw-bold mb-1">Admin Dashboard</h4>
        <p className="text-center mb-0 small">National Education Management Overview</p>
      </div>

      {/* Scrollable Section */}
      <section className="overflow-auto" style={{ maxHeight: "80vh", paddingBottom: "1rem" }}>
        {/* Summary Boxes */}
        <div className="container mb-4">
          <div className="row g-3">
            {[
              { label: "Total Students", value: stats.totalStudents, icon: "bi-people-fill", color: "primary" },
              { label: "Students with Disabilities", value: stats.studentsWithDisabilities, icon: "bi-person-wheelchair", color: "danger" },
              { label: "School Managers", value: stats.totalSchoolManagers, icon: "bi-person-badge-fill", color: "success" },
              { label: "Division Managers", value: stats.totalDivisionManagers, icon: "bi-diagram-3-fill", color: "warning" },
              { label: "Districts", value: stats.totalDistricts, icon: "bi-geo-alt-fill", color: "info" },
              { label: "Schools", value: stats.totalSchools, icon: "bi-building-fill", color: "secondary" },
            ].map((item, i) => (
              <div className="col-md-4 col-lg-2" key={i}>
                <div className={`card border-0 shadow-sm text-center text-${item.color}`}>
                  <div className="card-body">
                    <i className={`bi ${item.icon} fs-3 mb-2`}></i>
                    <h6 className="fw-bold">{item.label}</h6>
                    <h4 className="fw-bolder">{item.value}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements and Activities Section */}
        <div className="container mb-4">
          <div className="row g-3">
            {/* Announcements */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3 h-100">
                <h5 className="fw-bold text-primary mb-3">
                  <i className="bi bi-megaphone-fill me-2"></i>Recently Created Announcements
                </h5>
                <ul className="list-group list-group-flush">
                  {announcements.map((a) => (
                    <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{a.title}</span>
                      <small className="text-muted">{a.date}</small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-3 h-100">
                <h5 className="fw-bold text-success mb-3">
                  <i className="bi bi-activity me-2"></i>Recent Admin Activities
                </h5>
                <ul className="list-group list-group-flush">
                  {recentActivities.map((act) => (
                    <li key={act.id} className="list-group-item">
                      <strong>{act.actor}</strong> - {act.action}
                      <div className="text-muted small">{act.time}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
