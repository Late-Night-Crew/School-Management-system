import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY, DISPLAY_NAME_KEY } from "../views/constants/storageKeys";
import AuthService from "../views/Admin/services/auth";

export default function UnifiedSidebar({ isMobileOpen = false, setIsMobileOpen = () => { } }) {
  const navigate = useNavigate();
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

  const roleMenus = {
    super_admin: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      { name: "Manage Divisions", path: "/admin/managedivisions", icon: "bi-diagram-3" },
      { name: "Manage Districts", path: "/admin/managedistricts", icon: "bi-geo-alt" },
      { name: "Manage Schools", path: "/admin/manageschools", icon: "bi-building" },
      { name: "Manage Users", path: "/admin/users", icon: "bi-people" },
      { name: "Academic Year", path: "/admin/manageacademicyear", icon: "bi-calendar4-week" },
      { name: "Manage Students", path: "/admin/managestudents", icon: "bi-journal-bookmark" },
      { name: "Transfers", path: "/admin/transfers", icon: "bi-arrow-left-right" },
      { name: "Exam Results", path: "/admin/exam-results", icon: "bi-graph-up" },
      { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/admin/settings", icon: "bi-gear" },
    ],
    region_admin: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      { name: "Districts", path: "/regional/districts", icon: "bi-geo-alt" },
      { name: "Schools", path: "/regional/schools", icon: "bi-building" },
      { name: "Students", path: "/regional/students", icon: "bi-journal-bookmark" },
      { name: "Transfer Requests", path: "/regional/transfers", icon: "bi-arrow-left-right" },
      { name: "Reports", path: "/regional/reports", icon: "bi-file-earmark-text" },
      { name: "Settings", path: "/regional/settings", icon: "bi-gear" },
    ],
    school_manager: [
      { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
      { name: "Register Students", path: "/school/register", icon: "bi-person-plus" },
      { name: "Students", path: "/school/students", icon: "bi-journal-bookmark" },
      { name: "Transfers", path: "/school/transfers", icon: "bi-arrow-left-right" },
      { name: "Performance", path: "/school/performance", icon: "bi-bar-chart" },
      { name: "Reports", path: "/school/reports", icon: "bi-file-earmark-text" },
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

  const getLinkClass = ({ isActive }) => `unified-sidebar-link d-flex align-items-center justify-content-between px-3 py-2 mb-2 rounded ${isActive ? "active" : ""}`;

  return (
    <>
      <aside
        className={`unified-sidebar d-flex flex-column vh-100 ${isMobileOpen ? "d-flex" : "d-none d-md-flex"}`}
        style={{
          width: "100%",
          minHeight: "100%",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="unified-sidebar-header px-4 py-4">
          <div className="d-flex align-items-center gap-3">
            <div className="unified-logo">NS</div>
            <div>
              <h2 className="unified-system-name">NSMS</h2>
              <span className="unified-system-sub">National School Management</span>
            </div>
          </div>
          <div className="mt-3 unified-brand-meta">
            <div className="small text-white-75">Signed in as</div>
            <div className="fw-semibold">{displayName}</div>
          </div>
        </div>

        <nav className="flex-grow-1 overflow-auto px-3">
          <ul className="nav flex-column">
            {menuItems.map((item) => (
              <li className="nav-item" key={item.name}>
                <NavLink to={item.path} className={getLinkClass} onClick={() => setIsMobileOpen(false)}>
                  <div className="d-flex align-items-center">
                    <span className="unified-sidebar-icon">
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && <span className="badge unified-sidebar-badge">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-3 border-top border-white-10">
          <button className="btn btn-danger w-100 d-flex align-items-center justify-content-center" onClick={logout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>

        <div className="unified-sidebar-footer px-4 py-3 small text-white-50 text-center">
          © 2025 NSMS
        </div>

        <style>{`
          .unified-sidebar {
            background: #006a3d;
            color: #ffffff;
            box-shadow: 12px 0 32px rgba(0, 0, 0, 0.2);
          }

          .unified-sidebar-header {
            padding: 18px 18px 12px;
          }

          .unified-logo {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            background: #ffffff;
            color: #006a3d;
            display: grid;
            place-items: center;
            font-weight: 700;
          }

          .unified-system-name {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
          }

          .unified-system-sub {
            font-size: 12px;
            color: rgba(255,255,255,0.86);
            display: block;
            margin-top: 2px;
          }

          .unified-brand-meta {
            margin-top: 14px;
          }

          .unified-brand-meta .small {
            color: rgba(255,255,255,0.75);
          }

          .unified-brand-meta .fw-semibold {
            color: #ffffff;
          }

          .unified-sidebar-link {
            border: none;
            background: transparent;
            color: #ffffff;
            text-decoration: none;
            transition: all 0.2s ease;
            padding: 10px 14px;
            border-radius: 14px;
          }

          .unified-sidebar-link:hover {
            background: rgba(255,255,255,0.16);
            color: #ffffff;
          }

          .unified-sidebar-link.active {
            background: #ffffff;
            color: #006a3d;
            font-weight: 700;
          }

          .unified-sidebar-link.active .unified-sidebar-icon {
            background: #ffffff;
            color: #006a3d;
          }

          .unified-sidebar-icon {
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: rgba(255,255,255,0.18);
            margin-right: 12px;
            color: #ffffff;
            font-size: 1rem;
          }

          .unified-sidebar-badge {
            background: #ffffff !important;
            color: #006a3d !important;
            border-radius: 999px;
            font-size: 0.72rem;
            padding: 0.28rem 0.7rem;
          }

          .unified-sidebar-footer {
            background: rgba(255, 255, 255, 0.06);
          }

          @media (min-width: 768px) {
            .unified-sidebar {
              transform: translateX(0) !important;
            }
          }

          @media (max-width: 767.98px) {
            .unified-sidebar {
              width: 100%;
              max-width: 320px;
            }
          }
        `}</style>
      </aside>
    </>
  );
}
