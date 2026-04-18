import React, { useCallback } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY, DISPLAY_NAME_KEY, USER_EMAIL_KEY } from "../../constants/storageKeys";

const styles = {
  sidebar: {
    width: "280px",
    background: "#006a3d",
    color: "#ffffff",
    padding: "18px 16px",
    overflowY: "auto",
    maxHeight: "100vh",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "12px 0 28px rgba(0, 0, 0, 0.18)",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(255,255,255,0.35) rgba(0,106,61,0.12)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#ffffff",
    color: "#006a3d",
    display: "grid",
    placeItems: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  systemName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: 1.2,
    color: "#ffffff",
  },
  systemSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.8)",
    display: "block",
    marginTop: "3px",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.18)",
    marginBottom: "18px",
  },
  icon: (isActive) => ({
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.18)",
    marginRight: "12px",
    color: isActive ? "#006a3d" : "#ffffff",
    fontSize: "16px",
  }),
  logoutButton: {
    marginTop: "auto",
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "12px",
    background: "#ffffff",
    color: "#006a3d",
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  link: ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px 14px",
    borderRadius: "14px",
    color: isActive ? "#006a3d" : "#ffffff",
    backgroundColor: isActive ? "#ffffff" : "transparent",
    textDecoration: "none",
    fontWeight: isActive ? 700 : 500,
    marginBottom: "10px",
    transition: "all 0.18s ease",
  }),
  userCard: {
    padding: "16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    marginBottom: "20px",
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    color: "#006a3d",
    fontWeight: 700,
    fontSize: "16px",
  },
};

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: "bi-grid-3x3-gap-fill" },
  { name: "Manage Divisions", path: "/admin/managedivisions", icon: "bi-diagram-3-fill" },
  { name: "Manage Districts", path: "/admin/managedistricts", icon: "bi-geo-alt-fill" },
  { name: "Manage Schools", path: "/admin/manageschools", icon: "bi-building-fill" },
  { name: "Manage Users", path: "/admin/users", icon: "bi-people-fill" },
  { name: "Academic Year", path: "/admin/manageacademicyear", icon: "bi-calendar-check-fill" },
  { name: "Manage Students", path: "/admin/managestudents", icon: "bi-person-lines-fill" },
  { name: "Transfers", path: "/admin/transfers", icon: "bi-arrow-left-right-circle-fill" },
  { name: "Notice", path: "/admin/notices", icon: "bi-info-circle-fill" },
  { name: "Reports", path: "/admin/reports", icon: "bi-file-earmark-bar-graph-fill" },
  { name: "Settings", path: "/admin/settings", icon: "bi-sliders2-vertical" },
  { name: "Notifications", path: "/notifications", icon: "bi-bell-fill" },
];

export default function AdminSidebar({ role = "admin" }) {
  const roleLabel =
    role === "superadmin"
      ? "Super Admin"
      : role === "regional"
        ? "Regional Admin"
        : "School Manager";

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    window.location.href = "/admin/login";
  }, []);

  const displayName = localStorage.getItem(DISPLAY_NAME_KEY) || "Admin";
  const email = localStorage.getItem(USER_EMAIL_KEY) || "admin@example.com";

  return (
    <aside className="admin-sidebar" style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.logo}>NS</div>
        <div>
          <h2 style={styles.systemName}>NSMS</h2>
          <span style={styles.systemSub}>National School Management</span>
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.userCard}>
        <div className="d-flex align-items-center gap-3">
          <div style={styles.userAvatar}>A</div>
          <div>
            <div className="fw-semibold text-white">{displayName}</div>
            <div className="small text-white-75">{email}</div>
          </div>
        </div>
        <div className="mt-3 d-flex flex-wrap gap-2 align-items-center small">
          <span className="badge bg-white text-success rounded-pill px-2 py-1">{roleLabel}</span>
          <span className="text-white-75">Ready to manage</span>
        </div>
      </div>

      {menuItems.map((item) => (
        <NavLink key={item.name} to={item.path} style={({ isActive }) => styles.link({ isActive })}>
          {({ isActive }) => (
            <>
              <i className={item.icon} style={styles.icon(isActive)} />
              {item.name}
            </>
          )}
        </NavLink>
      ))}

      <button style={styles.logoutButton} onClick={logout}>
        <i className="bi bi-box-arrow-right" style={styles.icon(false)} />
        Logout
      </button>
    </aside>
  );
}
