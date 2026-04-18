import React from "react";

export default function SchoolSettings() {
    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>School Settings</h2>
                <p className="text-muted">Manage school-level configuration, notifications, and access preferences.</p>
            </div>
            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="mb-3">
                        <h6>School name</h6>
                        <p className="text-muted mb-0">Green Valley High</p>
                    </div>
                    <div className="mb-3">
                        <h6>Notification policy</h6>
                        <p className="text-muted mb-0">Email updates for new transfer requests and attendance issues.</p>
                    </div>
                    <div className="mb-3">
                        <h6>Manager contacts</h6>
                        <p className="text-muted mb-0">Update school manager and administrator contact information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
