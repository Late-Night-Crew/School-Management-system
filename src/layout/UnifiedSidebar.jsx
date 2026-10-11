import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./shell.css";
import { logout } from "../api/auth";
import { COMMS_CHANGED, getCommsSummary } from "../api/comms";
import { ROLES, ROLE_LABELS, getSession } from "../auth/session";

// Sidebar links for each role. Paths must match the routes in router.jsx.
// An item with `children` is a collapsible group of links.
function menuFor(session) {
  switch (session?.role) {
    case ROLES.SUPER_ADMIN:
      return [
        { name: "Dashboard", path: "/admin/dashboard", icon: "bi-speedometer2" },
        {
          name: "Manage",
          icon: "bi-sliders",
          children: [
            { name: "Divisions", path: "/admin/managedivisions", icon: "bi-diagram-3" },
            { name: "Districts", path: "/admin/managedistricts", icon: "bi-geo-alt" },
            { name: "Schools", path: "/admin/manageschools", icon: "bi-building" },
            { name: "Students", path: "/admin/managestudents", icon: "bi-journal-bookmark" },
            { name: "Subjects", path: "/admin/managesubjects", icon: "bi-book" },
            { name: "Academic Years", path: "/admin/manageacademicyear", icon: "bi-calendar4-week" },
            { name: "Accounts", path: "/admin/accounts", icon: "bi-people" },
          ],
        },
        { name: "Transfers", path: "/admin/transfers", icon: "bi-arrow-left-right" },
        { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-text" },
        { name: "Contacts", path: "/admin/contacts", icon: "bi-person-lines-fill" },
        { name: "Notifications", path: "/admin/notifications", icon: "bi-bell" },
        { name: "Settings", path: "/admin/settings", icon: "bi-gear" },
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
        { name: "School Accounts", path: `${base}/accounts`, icon: "bi-people" },
        { name: "Contacts", path: `${base}/contacts`, icon: "bi-person-lines-fill" },
        { name: "Notifications", path: `${base}/notifications`, icon: "bi-bell" },
        { name: "Settings", path: `${base}/settings`, icon: "bi-gear" },
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
        { name: "Contacts", path: `${base}/contacts`, icon: "bi-person-lines-fill" },
        { name: "Notifications", path: `${base}/notifications`, icon: "bi-bell" },
        { name: "Settings", path: `${base}/settings`, icon: "bi-gear" },
      ];
    }
    default:
      // Unknown roles get no menu; the route guard keeps them out of every page
      return [];
  }
}

const SUMMARY_POLL_MS = 60000;

// Unread notices plus unread conversations, for the Notifications badge. Refreshed
// every minute and whenever the communications screens report a change.
function useUnreadCount(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let current = true;
    const refresh = () =>
      getCommsSummary().then(
        (summary) => current && setCount(summary.unread_notices + summary.unread_conversations),
        () => {} // the badge is optional; pages report their own errors
      );
    refresh();
    const timer = setInterval(refresh, SUMMARY_POLL_MS);
    window.addEventListener(COMMS_CHANGED, refresh);
    return () => {
      current = false;
      clearInterval(timer);
      window.removeEventListener(COMMS_CHANGED, refresh);
    };
  }, [enabled]);
  return count;
}

export default function UnifiedSidebar({ isMobileOpen = false, setIsMobileOpen = () => {} }) {
  const navigate = useNavigate();
  const session = getSession();
  const unread = useUnreadCount(Boolean(session?.role));
  const menuItems = menuFor(session).map((item) =>
    item.name === "Notifications" && unread > 0 ? { ...item, badge: unread > 99 ? "99+" : unread } : item
  );

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
                {item.children ? (
                  <SidebarGroup group={item} onNavigate={() => setIsMobileOpen(false)} />
                ) : (
                  <NavLink to={item.path} className={getLinkClass} onClick={() => setIsMobileOpen(false)}>
                    <div className="d-flex align-items-center">
                      <span className="unified-sidebar-icon">
                        <i className={`bi ${item.icon}`} />
                      </span>
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <span className="badge unified-sidebar-badge">{item.badge}</span>}
                  </NavLink>
                )}
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

// A collapsible group of links, e.g. "Manage". It follows the page: open on one of its
// pages and closed elsewhere, so the sidebar fits without scrolling. It can still be
// toggled by hand; when collapsed on one of its pages, the header stays highlighted.
function SidebarGroup({ group, onNavigate }) {
  const { pathname } = useLocation();
  const hasActive = group.children.some((child) => pathname.startsWith(child.path));
  const [open, setOpen] = useState(hasActive);
  const listId = `sidebar-group-${group.name.toLowerCase().replace(/\W+/g, "-")}`;

  // Open on entering one of the group's pages, close on leaving them
  useEffect(() => {
    setOpen(hasActive);
  }, [hasActive]);

  return (
    <>
      <button
        type="button"
        className={`unified-sidebar-link unified-sidebar-group d-flex align-items-center justify-content-between px-3 py-2 mb-2 rounded ${
          hasActive && !open ? "has-active" : ""
        }`}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="d-flex align-items-center">
          <span className="unified-sidebar-icon">
            <i className={`bi ${group.icon}`} />
          </span>
          <span>{group.name}</span>
        </div>
        <i className={`bi bi-chevron-down unified-sidebar-chevron ${open ? "open" : ""}`} aria-hidden="true" />
      </button>
      <div className={`unified-sidebar-sub ${open ? "open" : ""}`}>
        <ul id={listId} className="unified-sidebar-sublist" inert={!open}>
          {group.children.map((child) => (
            <li key={child.path}>
              <NavLink
                to={child.path}
                className={({ isActive }) => `unified-sidebar-sublink ${isActive ? "active" : ""}`}
                onClick={onNavigate}
              >
                <i className={`bi ${child.icon}`} aria-hidden="true" />
                <span>{child.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
