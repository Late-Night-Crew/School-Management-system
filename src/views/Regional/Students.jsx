import React from "react";

export default function RegionalStudents() {
    const students = [
        { name: "Amina K.", school: "Maple Hill School", status: "Active" },
        { name: "Joseph M.", school: "Green Valley High", status: "Active" },
        { name: "Lydia P.", school: "Lakeview Primary", status: "Pending" },
        { name: "Daniel S.", school: "Riverside Academy", status: "Active" },
    ];

    return (
        <div className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">Regional Students</h2>
                    <p className="text-muted mb-0">Review student enrollment records managed by your region and approve any pending registrations.</p>
                </div>
                <button className="btn btn-outline-success">Export Students</button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>School</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.name}>
                                    <td>{student.name}</td>
                                    <td>{student.school}</td>
                                    <td>{student.status}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
