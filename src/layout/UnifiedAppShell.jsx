import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import UnifiedSidebar from "./UnifiedSidebar";
import { getSession, homePath, canAccess } from "../auth/session";

export default function UnifiedAppShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  const getInitials = (text) => {
    return text
      .split(/[_\s]+/)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Top bar title: which portal the user is in (each page shows its own title)
  const getTitle = () => PORTAL_TITLES[location.pathname.split("/")[1]] || "Dashboard";

  const headerStyles = {
    ...styles.topbar,
    position: "fixed",
    top: 0,
    left: isMobile ? 0 : 280,
    right: 0,
    width: isMobile ? "100%" : "calc(100% - 280px)",
    zIndex: 15,
  };

  // Pages draw their own padding (see components/ui/Page); leave room for the fixed top bar
  const contentStyles = {
    ...styles.content,
    paddingTop: TOPBAR_HEIGHT,
  };

  // Route guard: no valid session -> login; a page outside the user's role or
  // their own region/school -> their home page.
  const session = getSession();
  const home = homePath(session);
  if (!home) {
    return <Navigate to="/login" replace />;
  }
  if (session.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  if (!canAccess(location.pathname, session)) {
    return <Navigate to={home} replace />;
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

            <div style={styles.avatar}>{getInitials(session.displayName)}</div>
          </header>

          <main style={contentStyles}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

const TOPBAR_HEIGHT = 72;

const PORTAL_TITLES = {
  admin: "Ministry of Education Science & Technology (Malawi College of Distance Education)",
  regional: "Regional Office",
  school: "School Portal",
};

const styles = {
  pageContainer: {
    fontFamily: "var(--ui-font)",
    display: "flex",
    minHeight: "100vh",
    background: "var(--ui-bg)",
  },
  sidebarArea: {
    width: "280px",
    flexShrink: 0,
    background: "var(--ui-navy)",
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
    // Without this the main area grows to fit wide tables instead of letting them scroll
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  topbar: {
    height: TOPBAR_HEIGHT,
    boxSizing: "border-box",
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
    background: "var(--ui-gradient-button)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },
  content: {
    padding: 0,
  },
};
