import React from "react";

export default function RegionalReports() {
    const reports = [
        { title: "Regional Enrollment Trend", date: "2026-04-10" },
        { title: "School Performance Summary", date: "2026-04-08" },
        { title: "Transfer Approval Audit", date: "2026-04-06" },
    ];

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>Regional Reports</h2>
                <p className="text-muted">Access reports built for regional administration and monitoring.</p>
            </div>

            <div className="list-group shadow-sm">
                {reports.map((report) => (
                    <div key={report.title} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="mb-1">{report.title}</h6>
                            <small className="text-muted">{report.date}</small>
                        </div>
                        <button className="btn btn-sm btn-outline-primary">Open</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
