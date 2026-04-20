import React from "react";

export default function RegionalNotifications() {
    const items = [
        { message: "New transfer request submitted.", time: "10 minutes ago" },
        { message: "District data needs review.", time: "1 hour ago" },
        { message: "Weekly region summary is available.", time: "Yesterday" },
    ];

    return (
        <div className="p-4">
            <div className="mb-4">
                <h2>Regional Notifications</h2>
                <p className="text-muted">Your region-specific alerts and updates appear here.</p>
            </div>
            <div className="list-group shadow-sm">
                {items.map((item, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{item.message}</span>
                        <small className="text-muted">{item.time}</small>
                    </div>
                ))}
            </div>
        </div>
    );
}
