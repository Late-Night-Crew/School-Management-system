import React from "react";

export default function SchoolDashboard() {
    const stats = [
        { label: "Enrolled Students", value: 128, icon: "bi-people-fill" },
        { label: "Transfer Requests", value: 5, icon: "bi-arrow-left-right-circle-fill" },
        { label: "Open Classes", value: 24, icon: "bi-journal-bookmark-fill" },
        { label: "Attendance Rate", value: "93%", icon: "bi-check-circle-fill" },
    ];

    return (
        <div className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">School Dashboard</h2>
                    <p className="text-muted mb-0">This dashboard is for the school manager role, with dedicated school-specific insights and actions.</p>
                </div>
                <span className="badge bg-info text-dark py-2 px-3">School Role</span>
            </div>

            <div className="row g-3">
                {stats.map((item) => (
                    <div className="col-md-3" key={item.label}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body d-flex gap-3 align-items-center">
                                <div className="bg-light p-3 rounded-3 text-info">
                                    <i className={`bi ${item.icon} fs-4`} />
                                </div>
                                <div>
                                    <div className="text-muted small">{item.label}</div>
                                    <div className="fs-4 fw-bold">{item.value}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-3 mt-4">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h5 className="card-title">Latest Notices</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">Termly performance review scheduled for next week.</li>
                                <li className="list-group-item">Household outreach completed for 96% of students.</li>
                                <li className="list-group-item">Staff meeting set for Friday, 10AM.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <h5 className="card-title">Pending Actions</h5>
                            <p className="text-muted mb-3">Take action on transfer requests and student records that need school manager approval.</p>
                            <button className="btn btn-primary">Review transfers</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
