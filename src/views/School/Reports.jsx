import React from "react";

export default function SchoolReports() {
    const reports = [
        { title: "Daily Attendance", date: "2026-04-17" },
        { title: "Student Progress", date: "2026-04-15" },
        { title: "Transfer Summary", date: "2026-04-12" },
    ];

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>School Reports</h2>
                <p className="text-muted">View school-specific reports for attendance, performance, and transfers.</p>
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
