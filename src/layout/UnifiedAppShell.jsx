import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import UnifiedSidebar from "./UnifiedSidebar";
import { AUTH_TOKEN_KEY } from "../views/constants/storageKeys";

export default function UnifiedAppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Hide sidebar on login page
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="d-flex">
      {!hideSidebar && <UnifiedSidebar />}
      <main className="flex-grow-1 p-4 bg-light min-vh-100">
        <Outlet />
      </main>
    </div>
  );
}
