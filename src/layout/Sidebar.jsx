import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY } from "../views/constants/storageKeys";

export default function Sidebar() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_ROLE_KEY);
        window.location.href = "/";
    };

    const menuItems = [
        { name: "Dashboard", path: "/admin/dashboard", icon: "bi-speedometer2" },
        { name: "Schools", path: "/schools", icon: "bi-building" },
        { name: "Students", path: "/students", icon: "bi-people" },
        { name: "Teachers", path: "/teachers", icon: "bi-person-badge" },
        { name: "Reports", path: "/reports", icon: "bi-bar-chart" },
        { name: "Notifications", path: "/notifications", icon: "bi-bell", badge: 6 },
        { name: "Profile", path: "/profile", icon: "bi-person-circle" },
        { name: "Logout", icon: "bi-box-arrow-right", action: logout },
    ];

    const getLinkClass = ({ isActive }) =>
        `sidebar-link d-flex align-items-center justify-content-between ${isActive ? "active" : ""}`;

    return (
        <>
            {/* MOBILE OVERLAY */}
            {isMobileOpen && (
                <div className="overlay" onClick={() => setIsMobileOpen(false)} />
            )}

            <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>

                {/* ===== BRAND HEADER ===== */}
                <div className="sidebar-header">
                    <div className="brand">
                        <div className="logo">NS</div>
                        <div>
                            <h2>NSMS</h2>
                            <span>National School Management</span>
                        </div>
                    </div>

                    <button className="close-btn d-md-none" onClick={() => setIsMobileOpen(false)}>
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                {/* ===== USER CARD ===== */}
                <div className="user-card">
                    <div className="avatar">A</div>
                    <div>
                        <small>Signed in as</small>
                        <div className="name">Admin Team</div>
                    </div>
                </div>

                {/* ===== NAVIGATION ===== */}
                <nav className="nav-section">
                    {menuItems.map((item) => (
                        item.action ? (
                            <button
                                key={item.name}
                                className="sidebar-link"
                                onClick={() => {
                                    item.action();
                                    setIsMobileOpen(false);
                                }}
                            >
                                <div className="left">
                                    <i className={`bi ${item.icon}`} />
                                    <span>{item.name}</span>
                                </div>
                            </button>
                        ) : (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={getLinkClass}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <div className="left">
                                    <i className={`bi ${item.icon}`} />
                                    <span>{item.name}</span>
                                </div>
                                {item.badge && <span className="badge">{item.badge}</span>}
                            </NavLink>
                        )
                    ))}
                </nav>

                {/* ===== FOOTER ===== */}
                <div className="footer">
                    © 2026 NSMS
                </div>

            </aside>

            {/* MOBILE BUTTON */}
            <button className="mobile-toggle d-md-none" onClick={() => setIsMobileOpen(true)}>
                <i className="bi bi-list"></i>
            </button>

            {/* ===== STYLES ===== */}
            <style>{`
                .sidebar {
                    width: 280px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    background: #006a3d;
                    color: #ffffff;
                    display: flex;
                    flex-direction: column;
                    transform: translateX(-100%);
                    transition: 0.3s;
                    z-index: 1000;
                    padding: 16px 0;
                    box-shadow: 12px 0 32px rgba(0, 0, 0, 0.18);
                }

                .sidebar.open {
                    transform: translateX(0);
                }

                @media(min-width:768px){
                    .sidebar {
                        transform: translateX(0);
                    }
                }

                .overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    z-index: 999;
                }

                /* HEADER */
                .sidebar-header {
                    padding: 14px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo {
                    width: 42px;
                    height: 42px;
                    background: #ffffff;
                    color: #006a3d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-weight: bold;
                }

                .brand h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #ffffff;
                }

                .brand span {
                    font-size: 11px;
                    color: rgba(255,255,255,0.85);
                }

                /* USER */
                .user-card {
                    margin: 14px 16px;
                    padding: 14px;
                    background: rgba(255,255,255,0.12);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #ffffff;
                    color: #006a3d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }

                .name {
                    font-weight: 600;
                }

                /* NAV */
                .nav-section {
                    flex: 1;
                    padding: 10px;
                }

                .sidebar-link {
                    width: 100%;
                    border: none;
                    background: transparent;
                    padding: 10px 14px;
                    border-radius: 14px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #ffffff;
                    text-decoration: none;
                    transition: 0.2s;
                }

                .sidebar-link .left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .sidebar-link i {
                    font-size: 18px;
                    min-width: 20px;
                }

                .sidebar-link:hover {
                    background: rgba(255,255,255,0.12);
                }

                .sidebar-link.active {
                    background: #ffffff;
                    color: #006a3d;
                    font-weight: 700;
                }

                .sidebar-link.active .left i {
                    color: #006a3d;
                }

                .badge {
                    background: #dc2626;
                    color: white;
                    border-radius: 999px;
                    padding: 2px 8px;
                    font-size: 11px;
                }

                /* FOOTER */
                .footer {
                    padding: 14px;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    border-top: 1px solid #e2e8f0;
                }

                /* MOBILE BUTTON */
                .mobile-toggle {
                    position: fixed;
                    top: 15px;
                    left: 15px;
                    z-index: 1100;
                    background: #006a3d;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 8px 10px;
                }
            `}</style>
        </>
    );
}