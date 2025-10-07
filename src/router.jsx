import React from "react";
import { createHashRouter } from "react-router-dom";
import AppShell from "./layout/Appshell";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminLogin from "./views/Admin/AdminAuth/AdminLogin";
import Login from "./views/Auth/login";

const router = createHashRouter([
    {
        path: "/",
        element: <AppShell />,
        children: [
            { path: "", element:<Login /> },
            { path: "dashboard", element: <div>Dashboard Page</div> }
        ]
    },
    {
        path: "/admin",
        element: <AdminAppShell />,
        children: [
            { path: "login", element: <AdminLogin /> }
        ]
    }

]);

export default router;