import React from "react";

export default function SchoolNotifications() {
    const notifications = [
        { message: "New transfer request approved.", time: "15 minutes ago" },
        { message: "Attendance alert for Class 8A.", time: "2 hours ago" },
        { message: "Staff meeting scheduled.", time: "Yesterday" },
    ];

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>School Notifications</h2>
                <p className="text-muted">Your school-specific alerts and updates are listed below.</p>
            </div>
            <div className="list-group shadow-sm">
                {notifications.map((item, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{item.message}</span>
                        <small className="text-muted">{item.time}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
