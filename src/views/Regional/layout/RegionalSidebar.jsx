import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY, DISPLAY_NAME_KEY, USER_EMAIL_KEY } from "../../constants/storageKeys";

export default function RegionalSidebar() {
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState("User");
    const [email, setEmail] = useState("user@example.com");

    useEffect(() => {
        const storedName = localStorage.getItem(DISPLAY_NAME_KEY);
        const storedEmail = localStorage.getItem(USER_EMAIL_KEY);
        if (storedName) setDisplayName(storedName);
        if (storedEmail) setEmail(storedEmail);
    }, []);

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        localStorage.removeItem(DISPLAY_NAME_KEY);
        navigate("/login");
    };

    const menuItems = [
        { name: "Dashboard", path: "/regional/dashboard", icon: "bi-speedometer2" },
        { name: "Districts", path: "/regional/districts", icon: "bi-geo-alt" },
        { name: "Schools", path: "/regional/schools", icon: "bi-building" },
        { name: "Students", path: "/regional/students", icon: "bi-journal-bookmark" },
        { name: "Transfers", path: "/regional/transfers", icon: "bi-arrow-left-right" },
        { name: "Reports", path: "/regional/reports", icon: "bi-file-earmark-text" },
        { name: "Settings", path: "/regional/settings", icon: "bi-gear" },
        { name: "Notifications", path: "/regional/notifications", icon: "bi-bell" },
    ];

    const getLinkClass = ({ isActive }) =>
        `sidebar-link d-flex align-items-center justify-content-between ${isActive ? "active" : ""}`;

    return (
        <aside className="role-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo">NS</div>
                <div>
                    <h2>NSMS</h2>
                    <span>Regional Admin</span>
                </div>
            </div>

            <div className="sidebar-user-card">
                <div className="avatar">{displayName[0] || "U"}</div>
                <div>
                    <div className="fw-semibold">{displayName}</div>
                    <small>{email}</small>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink key={item.name} to={item.path} className={getLinkClass}>
                        <div className="nav-left">
                            <i className={`bi ${item.icon}`} />
                            <span>{item.name}</span>
                        </div>
                    </NavLink>
                ))}
            </nav>

            <button className="sidebar-logout" onClick={logout}>
                <i className="bi bi-box-arrow-right" />
                Logout
            </button>

            <style>{`
        .role-sidebar {
          width: 280px;
          min-height: 100vh;
          background: #006a3d;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 18px 16px;
          box-shadow: 12px 0 32px rgba(0, 0, 0, 0.18);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sidebar-logo {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          background: white;
          color: #006a3d;
          border-radius: 14px;
          font-weight: 700;
        }

        .sidebar-brand h2 {
          margin: 0;
          font-size: 16px;
        }

        .sidebar-brand span {
          display: block;
          font-size: 11px;
          color: rgba(255,255,255,0.85);
        }

        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.12);
          padding: 14px;
          border-radius: 16px;
          margin-bottom: 22px;
        }

        .sidebar-user-card .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          color: #006a3d;
          display: grid;
          place-items: center;
          font-weight: 700;
        }

        .sidebar-user-card .fw-semibold {
          color: #ffffff;
          margin-bottom: 4px;
        }

        .sidebar-user-card small {
          color: rgba(255,255,255,0.75);
        }

        .sidebar-nav {
          flex: 1;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: transparent;
          color: white;
          text-decoration: none;
          padding: 12px 14px;
          border-radius: 14px;
          margin-bottom: 10px;
          transition: background 0.2s ease;
        }

        .sidebar-link:hover {
          background: rgba(255,255,255,0.12);
        }

        .sidebar-link.active {
          background: white;
          color: #006a3d;
          font-weight: 700;
        }

        .sidebar-link.active i {
          color: #006a3d;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-logout {
          margin-top: auto;
          border: none;
          border-radius: 14px;
          padding: 12px 14px;
          background: white;
          color: #006a3d;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
        }
      `}</style>
        </aside>
    );
}
