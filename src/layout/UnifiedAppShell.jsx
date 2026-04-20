import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import UnifiedSidebar from "./UnifiedSidebar";
import { AUTH_TOKEN_KEY, USER_ROLE_KEY, DISPLAY_NAME_KEY } from "../views/constants/storageKeys";

export default function UnifiedAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [role, setRole] = useState("user");
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const storedRole = localStorage.getItem(USER_ROLE_KEY);
    const storedName = localStorage.getItem(DISPLAY_NAME_KEY);
    if (storedRole) setRole(storedRole);
    if (storedName) setDisplayName(storedName);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");

    const handleMedia = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) setMenuOpen(false);
    };

    handleMedia(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMedia);
    } else {
      mediaQuery.addListener(handleMedia);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMedia);
      } else {
        mediaQuery.removeListener(handleMedia);
      }
    };
  }, []);

  const hideSidebar = location.pathname === "/login";

  const getInitials = (text) => {
    return text
      .split(/[_\s]+/)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getTitle = () => {
    const route = location.pathname === "/" ? "Dashboard" : location.pathname.replace(/\//g, " ").trim();
    return route
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const headerStyles = {
    ...styles.topbar,
    position: "fixed",
    top: 0,
    left: isMobile ? 0 : 280,
    right: 0,
    width: isMobile ? "100%" : "calc(100% - 280px)",
    zIndex: 15,
  };

  const contentStyles = {
    ...styles.content,
    paddingTop: "88px",
  };

  if (hideSidebar) {
    return <Outlet />;
  }

  return (
    <>
      {isMobile && menuOpen && <div style={styles.overlay} onClick={() => setMenuOpen(false)} />}

      <div style={styles.pageContainer}>
        <aside
          style={{
            ...styles.sidebarArea,
            ...(isMobile ? styles.sidebarMobile : {}),
            transform: isMobile
              ? menuOpen
                ? "translateX(0)"
                : "translateX(-100%)"
              : "none",
          }}
        >
          <UnifiedSidebar isMobileOpen={menuOpen} setIsMobileOpen={setMenuOpen} />
        </aside>

        <div style={styles.mainArea}>
          <header style={headerStyles}>
            <div style={styles.titleRow}>
              {isMobile && (
                <button style={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)}>
                  ☰
                </button>
              )}

              <div>
                <span style={styles.meta}>National School Management</span>
                <h1 style={styles.title}>{getTitle()}</h1>
              </div>
            </div>

            <div style={styles.avatar}>{getInitials(displayName || role)}</div>
          </header>

          <main style={contentStyles}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  pageContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fb",
  },
  sidebarArea: {
    minWidth: "280px",
    background: "#006a3d",
    color: "#fff",
    height: "100vh",
    position: "sticky",
    top: 0,
    zIndex: 10,
    transition: "0.3s",
  },
  sidebarMobile: {
    position: "fixed",
    left: 0,
    top: 0,
    width: "85%",
    maxWidth: "320px",
    height: "100%",
    zIndex: 30,
    boxShadow: "2px 0 20px rgba(0,0,0,0.2)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 20,
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  menuButton: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: "18px",
  },
  meta: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#166534",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  content: {
    padding: "18px",
  },
};
