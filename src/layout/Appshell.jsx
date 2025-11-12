import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";

  return (
    <div className="d-flex">
      {!hideSidebar && <Sidebar />}
      <main className="flex-grow-1 bg-light min-vh-100">
        <Outlet />
      </main>
    </div>
  );
}
