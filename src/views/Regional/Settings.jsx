import React from "react";

export default function RegionalSettings() {
    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>Regional Settings</h2>
                <p className="text-muted">Configure regional preferences and access controls for your team.</p>
            </div>
            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="mb-3">
                        <h6>Region name</h6>
                        <p className="text-muted mb-0">Southern Education Region</p>
                    </div>
                    <div className="mb-3">
                        <h6>Notification preferences</h6>
                        <p className="text-muted mb-0">Email alerts for transfer requests and school changes.</p>
                    </div>
                    <div className="mb-3">
                        <h6>User access</h6>
                        <p className="text-muted mb-0">Manage regional admin and district manager permissions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
