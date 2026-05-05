import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* SCOPED STYLING TO PREVENT GLOBAL CONFLICTS */
/* All classes prefixed with .sn- */

.sn-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #F3F4F6;
  min-height: 100vh;
  color: #1e293b;
  padding: 2rem;
}

.sn-container {
  max-width: 900px;
  margin: 0 auto;
}

/* HEADER */
.sn-header {
  margin-bottom: 2rem;
}

.sn-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
}

.sn-header p {
  color: #64748b;
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

/* CARD & LIST */
.sn-card {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
}

.sn-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sn-item {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.sn-item:last-child {
  border-bottom: none;
}

.sn-item:hover {
  background-color: #f8fafc;
}

/* Unread indicator */
.sn-item.unread .sn-title {
  color: #0f172a;
  font-weight: 700;
}

.sn-item.unread::before {
  content: '';
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: #2563eb;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

/* ICONS */
.sn-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1.25rem;
  flex-shrink: 0;
  position: relative; /* Z-index to handle the unread dot */
}

.icon-message { background-color: #eff6ff; color: #2563eb; }
.icon-alert { background-color: #fee2e2; color: #ef4444; }
.icon-transfer { background-color: #dcfce7; color: #16a34a; }

/* CONTENT */
.sn-content {
  flex-grow: 1;
}

.sn-title {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
  line-height: 1.4;
}

.sn-message {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* TIME */
.sn-time {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 1rem;
  align-self: flex-start;
}

/* BADGE */
.sn-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  letter-spacing: 0.05em;
}

.badge-new { background-color: #2563eb; color: white; }
.badge-msg { background-color: #dbeafe; color: #1e40af; }
`;

const SchoolNotifications = () => {
    const navigate = useNavigate();

    // Mock Data with Types
    const [notifications, setNotifications] = useState([
        { 
            id: 1, 
            type: 'message', 
            title: 'Admin Update', 
            message: 'The academic calendar for Term 3 has been finalized. Please review the attached PDF.', 
            time: '10 minutes ago', 
            read: false 
        },
        { 
            id: 2, 
            type: 'message', 
            title: 'New Message from Regional Office', 
            message: 'Regarding the upcoming inspection scheduled for next month, please confirm your availability.', 
            time: '2 hours ago', 
            read: false 
        },
        { 
            id: 3, 
            type: 'alert', 
            title: 'Attendance Warning', 
            message: 'Class 8A attendance dropped below 85% this week. Immediate action advised.', 
            time: '5 hours ago', 
            read: true 
        },
        { 
            id: 4, 
            type: 'transfer', 
            title: 'Transfer Request Approved', 
            message: 'John Doe transfer request to Capital High has been successfully approved.', 
            time: 'Yesterday', 
            read: true 
        },
        { 
            id: 5, 
            type: 'alert', 
            title: 'System Maintenance', 
            message: 'The server will be undergoing maintenance this Sunday at 2:00 AM.', 
            time: '2 days ago', 
            read: true 
        },
    ]);

    const handleNotificationClick = (item) => {
        // Mark as read logic (in a real app, this would be an API call)
        const updated = notifications.map(n => 
            n.id === item.id ? { ...n, read: true } : n
        );
        setNotifications(updated);

        // Navigation Logic
        if (item.type === 'message') {
            console.log(`Navigating to Inbox: /inbox/conversation/${item.id}`);
            alert(`Navigating to Inbox Conversation for: ${item.title}`);
            // In a real router: navigate(`/inbox/conversation/${item.id}`);
        } else if (item.type === 'transfer') {
            console.log(`Navigating to Transfers: /school/transfers`);
            navigate('/school/transfers'); // Example navigation
        } else {
            // Generic click
            console.log(`Viewing notification details: ${item.id}`);
        }
    };

    const getIconClass = (type) => {
        switch(type) {
            case 'message': return 'icon-message';
            case 'alert': return 'icon-alert';
            case 'transfer': return 'icon-transfer';
            default: return 'icon-message';
        }
    };

    const getIconSymbol = (type) => {
        switch(type) {
            case 'message': return 'bi-envelope';
            case 'alert': return 'bi-exclamation-octagon';
            case 'transfer': return 'bi-arrow-left-right';
            default: return 'bi-bell';
        }
    };

    return (
        <>
            <style>{CSS}</style>
            <div className="sn-wrapper">
                <div className="sn-container">
                    
                    {/* Header */}
                    <div className="sn-header">
                        <h1>School Notifications</h1>
                        <p>Stay updated with system alerts, messages from HQ, and student activities.</p>
                    </div>

                    {/* Notifications List */}
                    <div className="sn-card">
                        <ul className="sn-list">
                            {notifications.map((item) => (
                                <li 
                                    key={item.id} 
                                    className={`sn-item ${!item.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(item)}
                                >
                                    {/* Icon */}
                                    <div className={`sn-icon-box ${getIconClass(item.type)}`}>
                                        <i className={`bi ${getIconSymbol(item.type)}`}></i>
                                    </div>

                                    {/* Text Content */}
                                    <div className="sn-content">
                                        <div className="sn-title">
                                            {item.title}
                                            {!item.read && <span className="sn-badge badge-new">NEW</span>}
                                        </div>
                                        <div className="sn-message">{item.message}</div>
                                    </div>

                                    {/* Time */}
                                    <div className="sn-time">
                                        {item.time}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                        {/* Empty State (if list is empty) */}
                        {notifications.length === 0 && (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                                <i className="bi bi-check-circle" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.5 }}></i>
                                <p>You are all caught up!</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default SchoolNotifications;