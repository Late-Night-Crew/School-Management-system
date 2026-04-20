import React from "react";

export default function RegionalSchools() {
    const schools = [
        { name: "Maple Hill School", type: "Primary", district: "Central" },
        { name: "Green Valley High", type: "Secondary", district: "Southern" },
        { name: "Lakeview Primary", type: "Primary", district: "Eastern" },
        { name: "Riverside Academy", type: "Secondary", district: "Northern" },
    ];

    return (
        <div className="p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h2 className="mb-1">Regional Schools</h2>
                    <p className="text-muted mb-0">Monitor school performance and review school registrations within your region.</p>
                </div>
                <button className="btn btn-primary">Review Schools</button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>School Name</th>
                                <th>Type</th>
                                <th>District</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schools.map((school) => (
                                <tr key={school.name}>
                                    <td>{school.name}</td>
                                    <td>{school.type}</td>
                                    <td>{school.district}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-secondary">View</button>
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
