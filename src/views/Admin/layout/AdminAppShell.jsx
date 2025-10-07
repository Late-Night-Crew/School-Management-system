import React from "react";
import { Outlet, useLocation } from "react-router-dom";
// import AdminSidebar from "./Sidebar";

export default function AdminAppShell() {
    // const location = useLocation();
    // const hideSidebar =
    //     location.pathname === "/admin/login" ||
    //     location.pathname === "/admin/create-user";

    return (
        <div className="d-flex">
            {/* {!hideSidebar && <AdminSidebar />} */}
            <main className="flex-grow-1 p-4 bg-light min-vh-100">
                <Outlet />
            </main>
        </div>
    );
}
