import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/";

  return (
    <>
      <div className="d-flex">
        {!hideSidebar && <Sidebar />}
        <main className="flex-grow-1 bg-light min-vh-100 app-main">
          <Outlet />
        </main>   
      </div>
      <style>{`
        .app-main {
          margin-left: 280px;
        }

        @media (max-width: 767.98px) {
          .app-main {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}
