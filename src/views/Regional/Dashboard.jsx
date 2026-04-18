import React from "react";

export default function RegionalDashboard() {
    const stats = [
        { label: "Districts", value: 12, icon: "bi-geo-alt-fill" },
        { label: "Schools", value: 54, icon: "bi-building-fill" },
        { label: "Students", value: 1_820, icon: "bi-people-fill" },
        { label: "Pending Transfers", value: 7, icon: "bi-arrow-left-right-circle-fill" },
    ];

    return (
        <div className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">Regional Dashboard</h2>
                    <p className="text-muted mb-0">
                        This dashboard is dedicated to the regional admin role. Track region performance, review transfer requests, and monitor school activity.
                    </p>
                </div>
                <span className="badge bg-success py-2 px-3">Regional Role</span>
            </div>

            <div className="row g-3">
                {stats.map((item) => (
                    <div className="col-md-3" key={item.label}>
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body d-flex align-items-center gap-3">
                                <div className="bg-light rounded-3 p-3 text-success">
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
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title">Region activity</h5>
                            <p className="text-muted">
                                View your region's current school capacity, student enrollment trends, and outstanding actions without using shared admin pages.
                            </p>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">5 schools need updated student data</li>
                                <li className="list-group-item">2 districts with pending approvals</li>
                                <li className="list-group-item">Community outreach plan due next week</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h5 className="card-title">Transfer pipeline</h5>
                            <p className="text-muted mb-3">
                                Review transfer requests submitted by schools and district managers for your region.
                            </p>
                            <div className="d-flex justify-content-between">
                                <span className="badge bg-primary">New requests: 3</span>
                                <span className="badge bg-warning text-dark">In review: 4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
