import React from "react";
import { createHashRouter } from "react-router-dom";
import AppShell from "./layout/Appshell";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminLogin from "./views/Admin/AdminAuth/AdminLogin";
import Login from "./views/Auth/login";
import AdminDashboard from "./views/Admin/Dashboard";

const router = createHashRouter([
    {
        path: "/",
        element: <AppShell />,
        children: [
            { path: "", element: <Login /> },
         
        ]
    },
    {
        path: "/admin",
        element: <AdminAppShell />,
        children: [
            { path: "login", element: <AdminLogin /> },
            { path: "dashboard", element: <AdminDashboard /> }
        ]
    }

]);

export default router;