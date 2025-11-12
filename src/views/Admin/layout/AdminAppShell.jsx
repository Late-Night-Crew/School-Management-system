import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSIdebar";


export default function AdminAppShell() {
    const location = useLocation();
    const hideSidebar =
        location.pathname === "/admin/" ||
        location.pathname === "/admin" ||
        location.pathname === "/admin/login";

    return (
        <div className="d-flex">
            {!hideSidebar && <AdminSidebar />}
            <main className="flex-grow-1 p-4 bg-light min-vh-100">
                <Outlet />
            </main>
        </div>
    );
}
