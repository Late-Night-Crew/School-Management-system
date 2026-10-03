import { NavLink, useNavigate } from "react-router-dom";
import "./shell.css";
import { logout } from "../api/auth";
import { ROLES, ROLE_LABELS, getSession } from "../auth/session";

// Sidebar links for each role. Paths must match the routes in router.jsx.
function menuFor(session) {
  switch (session?.role) {
    case ROLES.SUPER_ADMIN:
      return [
        { name: "Dashboard", path: "/admin/dashboard", icon: "bi-speedometer2" },
        { name: "Manage Divisions", path: "/admin/managedivisions", icon: "bi-diagram-3" },
        { name: "Manage Districts", path: "/admin/managedistricts", icon: "bi-geo-alt" },
        { name: "Manage Schools", path: "/admin/manageschools", icon: "bi-building" },
        { name: "Academic Year", path: "/admin/manageacademicyear", icon: "bi-calendar4-week" },
        { name: "Manage Students", path: "/admin/managestudents", icon: "bi-journal-bookmark" },
        { name: "Subjects", path: "/admin/managesubjects", icon: "bi-book" },
        { name: "Transfers", path: "/admin/transfers", icon: "bi-arrow-left-right" },
        { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-text" },
        { name: "Notifications", path: "/admin/notifications", icon: "bi-bell" },
      ];
    case ROLES.REGIONAL_ADMIN: {
      const base = `/regional/${session.regionId}`;
      return [
        { name: "Dashboard", path: `${base}/dashboard`, icon: "bi-speedometer2" },
        { name: "Districts", path: `${base}/districts`, icon: "bi-geo-alt" },
        { name: "Schools", path: `${base}/schools`, icon: "bi-building" },
        { name: "Students", path: `${base}/students`, icon: "bi-journal-bookmark" },
        { name: "Transfer Requests", path: `${base}/transfers`, icon: "bi-arrow-left-right" },
        { name: "Reports", path: `${base}/reports`, icon: "bi-file-earmark-text" },
        { name: "Settings", path: `${base}/settings`, icon: "bi-gear" },
        { name: "Notifications", path: `${base}/notifications`, icon: "bi-bell" },
      ];
    }
    case ROLES.SCHOOL_MANAGER: {
      const base = `/school/${session.schoolId}`;
      return [
        { name: "Dashboard", path: `${base}/dashboard`, icon: "bi-speedometer2" },
        { name: "Academic Year", path: `${base}/academicyear`, icon: "bi-calendar4-week" },
        { name: "Register Students", path: `${base}/register`, icon: "bi-person-plus" },
        { name: "Students", path: `${base}/students`, icon: "bi-journal-bookmark" },
        { name: "Enter Marks", path: `${base}/marks`, icon: "bi-pen" },
        { name: "Transfers", path: `${base}/transfers`, icon: "bi-arrow-left-right" },
        { name: "Reports", path: `${base}/reports`, icon: "bi-file-earmark-text" },
        { name: "Settings", path: `${base}/settings`, icon: "bi-gear" },
        { name: "Notifications", path: `${base}/notifications`, icon: "bi-bell" },
      ];
    }
    default:
      // Unknown roles get no menu; the route guard keeps them out of every page
      return [];
  }
}

export default function UnifiedSidebar({ isMobileOpen = false, setIsMobileOpen = () => {} }) {
  const navigate = useNavigate();
  const session = getSession();
  const menuItems = menuFor(session);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
          <div className="unified-brand-meta">
            <div className="unified-brand-name">{session?.displayName}</div>
            <div className="unified-brand-role">{ROLE_LABELS[session?.role] || "User"}</div>
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

        <div className="px-4 pt-3">
          <button type="button" className="unified-logout" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" />
            Logout
          </button>
        </div>

        <div className="unified-sidebar-footer">© {new Date().getFullYear()} NSMS</div>

      </aside>
    </>
  );
}
