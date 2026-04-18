import React from "react";

export default function RegionalDistricts() {
    const districts = [
        { name: "Central District", schools: 18, status: "Active" },
        { name: "Southern District", schools: 24, status: "Active" },
        { name: "Northern District", schools: 12, status: "Pending" },
        { name: "Eastern District", schools: 10, status: "Active" },
    ];

    return (
        <div className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">Regional Districts</h2>
                    <p className="text-muted mb-0">Manage district operations and monitor district status within your assigned region.</p>
                </div>
                <button className="btn btn-success">Add District</button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <table className="table table-striped mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>District</th>
                                <th>Schools</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {districts.map((district) => (
                                <tr key={district.name}>
                                    <td>{district.name}</td>
                                    <td>{district.schools}</td>
                                    <td>{district.status}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary me-2">Edit</button>
                                        <button className="btn btn-sm btn-outline-danger">Archive</button>
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
