import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  AUTH_TOKEN_KEY,
  USER_ROLE_KEY,
  DISPLAY_NAME_KEY,
} from "../views/constants/storageKeys";
import AuthService from "../views/Admin/services/auth";

export default function UnifiedSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const storedRole = localStorage.getItem(USER_ROLE_KEY);
    const storedName = localStorage.getItem(DISPLAY_NAME_KEY);
    if (storedRole) setRole(storedRole.toLowerCase());
    if (storedName) setDisplayName(storedName);
  }, []);

  const logout = () => {
    AuthService.logout();
    navigate("/login");
  };

  // Role-specific menu configuration
  const roleMenus = {
    super_admin: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      {
        name: "Manage Divisions",
        path: "/admin/managedivisions",
        icon: "bi-diagram-3",
      },
      {
        name: "Manage Districts",
        path: "/admin/managedistricts",
        icon: "bi-geo-alt",
      },
      {
        name: "Manage Schools",
        path: "/admin/manageschools",
        icon: "bi-building",
      },
      {
        name: "Manage Users",
        path: "/admin/users",
        icon: "bi-people",
      },
      {
        name: "Academic Year",
        path: "/admin/manageacademicyear",
        icon: "bi-calendar4-week",
      },
      {
        name: "Manage Students",
        path: "/admin/managestudents",
        icon: "bi-journal-bookmark",
      },
      {
        name: "Transfers",
        path: "/admin/transfers",
        icon: "bi-arrow-left-right",
      },
      {
        name: "Exam Results",
        path: "/admin/exam-results",
        icon: "bi-graph-up",
      },
      { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/admin/settings", icon: "bi-gear" },
    ],
    region_admin: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      { name: "Districts", path: "/regional/districts", icon: "bi-geo-alt" },
      {
        name: "Schools",
        path: "/regional/schools",
        icon: "bi-building",
      },
      {
        name: "Students",
        path: "/regional/students",
        icon: "bi-journal-bookmark",
      },
      {
        name: "Transfer Requests",
        path: "/regional/transfers",
        icon: "bi-arrow-left-right",
      },
      {
        name: "Reports",
        path: "/regional/reports",
        icon: "bi-file-earmark-text",
      },
      { name: "Settings", path: "/regional/settings", icon: "bi-gear" },
    ],
    school_manager: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      {
        name: "Register Students",
        path: "/school/register",
        icon: "bi-person-plus",
      },
      {
        name: "Students",
        path: "/school/students",
        icon: "bi-journal-bookmark",
      },
      {
        name: "Transfers",
        path: "/school/transfers",
        icon: "bi-arrow-left-right",
      },
      {
        name: "Performance",
        path: "/school/performance",
        icon: "bi-bar-chart",
      },
      {
        name: "Reports",
        path: "/school/reports",
        icon: "bi-file-earmark-text",
      },
      { name: "Settings", path: "/school/settings", icon: "bi-gear" },
    ],
  };

  const menuItems = [
    ...(roleMenus[role] || roleMenus.super_admin),
    { name: "Notifications", path: "/notifications", icon: "bi-bell", badge: 6 },
  ];

  const getRoleLabel = () => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "region_admin":
        return "Regional Admin";
      case "school_manager":
        return "School Manager";
      default:
        return "User";
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`d-flex flex-column vh-100 bg-dark text-light shadow-lg ${
          isMobileOpen ? "d-flex" : "d-none d-md-flex"
        }`}
        style={{
          width: "260px",
          position: isMobileOpen ? "fixed" : "relative",
          zIndex: 1045,
          transition: "all 0.3s ease",
        }}
      >
        {/* Header with User Info */}
        <div className="px-3 py-3 border-bottom border-secondary">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h5 className="m-0 fw-bold text-uppercase" style={{ fontSize: "0.9rem" }}>
              {getRoleLabel()}
            </h5>
            <button
              className="btn btn-sm btn-dark d-md-none border-0"
              onClick={() => setIsMobileOpen(false)}
            >
              <i className="bi bi-x fs-4"></i>
            </button>
          </div>
          <small className="text-muted d-block mb-1">{displayName}</small>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 overflow-auto mt-2">
          <ul className="nav flex-column px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li className="nav-item mb-1" key={item.name}>
                  <Link
                    to={item.path}
                    className={`nav-link d-flex align-items-center justify-content-between px-3 py-2 rounded ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-light hover-effect"
                    }`}
                    style={{
                      transition: "all 0.2s",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                    }}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div className="d-flex align-items-center flex-grow-1">
                      <i
                        className={`bi ${item.icon}`}
                        style={{ fontSize: "1.1rem", minWidth: "1.5rem" }}
                      ></i>
                      <span className="ms-3">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="badge bg-danger rounded-pill ms-2">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="px-2 py-3 border-top border-secondary">
          <button
            className="btn btn-danger w-100 d-flex align-items-center justify-content-center"
            onClick={logout}
            style={{ fontSize: "0.9rem" }}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-2 border-top border-secondary small text-muted">
          © 2025 NSMS
        </div>

        <style>{`
          .hover-effect:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
          }
        `}</style>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="btn btn-dark d-md-none position-fixed shadow-sm"
        style={{
          zIndex: 1050,
          top: "1rem",
          left: "1rem",
        }}
        onClick={() => setIsMobileOpen(true)}
      >
        <i className="bi bi-list fs-4"></i>
      </button>
    </>
  );
}
