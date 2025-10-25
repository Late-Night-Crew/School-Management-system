import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function AdminSidebar({ role = "admin" }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Common menu items for all roles
  const commonItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "bi-speedometer2" },
  ];

  // Role-specific menu sets
  const roleMenus = {
    admin: [
      
      {name: "Manage Divisions", path: "/admin/managedivisions", icon: "bi-diagram-3" },
      {name: "manage Districts", path: "/admin/managedistricts", icon: "bi-geo-alt" },
      { name: "Manage Schools", path: "/admin/manageschools", icon: "bi-building" },
      { name: "Manage Users", path: "/admin/users", icon: "bi-people" },
      {name: "Academic year", path: "/admin/academicyear", icon: "bi-calendar4-week" },
      {name: "Manage Students", path: "/admin/managestudents", icon: "bi-journal-bookmark" },
      {name: "Transfers", path: "/admin/transfers", icon: "bi-arrow-left-right" },
      {name: "Notice", path: "/admin/notices", icon: "bi-info-square" },
      { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/admin/settings", icon: "bi-gear" },
    ],
    region_admin: [
      { name: "Schools", path: "/regional/schools", icon: "bi-building" },
      { name: "Transfer Requests", path: "/regional/transfers", icon: "bi-arrow-left-right" },
      { name: "Reports", path: "/regional/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/regional/settings", icon: "bi-gear" },
    ],
    school_admin: [
      { name: "Register Learners", path: "/school/register", icon: "bi-person-plus" },
      { name: "Performance", path: "/school/performance", icon: "bi-bar-chart" },
      { name: "Transfers", path: "/school/transfers", icon: "bi-arrow-left-right" },
      { name: "Reports", path: "/school/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/school/settings", icon: "bi-gear" },
    ],
  };

  // Combine menus
  const menuItems = [
    ...commonItems,
    ...(roleMenus[role] || []),
    
    { name: "Notifications", path: "/notifications", icon: "bi-bell", badge: 6 },
    { name: "Logout", path: "/logout", icon: "bi-box-arrow-right" },
  ];

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
        {/* Header */}
        <div className="px-3 py-3 border-bottom border-secondary d-flex align-items-center justify-content-between">
          <h5 className="m-0 fw-bold text-uppercase">
            {role === "superadmin"
              ? "Super Admin"
              : role === "regional"
              ? "Regional Admin"
              : "School Manager"}
          </h5>
          <button
            className="btn btn-sm btn-dark d-md-none border-0"
            onClick={() => setIsMobileOpen(false)}
          >
            <i className="bi bi-x fs-4"></i>
          </button>
        </div>

        {/* Menu */}
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
                    <div className="d-flex align-items-center">
                      <i
                        className={`bi ${item.icon}`}
                        style={{ fontSize: "1.1rem" }}
                      ></i>
                      <span className="ms-3">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="badge bg-danger rounded-pill">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

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

      {/* Mobile Button */}
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
