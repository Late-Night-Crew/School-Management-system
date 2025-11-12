import React from "react";
import { createHashRouter } from "react-router-dom";
import AppShell from "./layout/Appshell";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminLogin from "./views/Auth/Adminlogin";
import Login from "./views/Auth/Login";
import AdminDashboard from "./views/Admin/Dashboard";
import ManageSchool from "./views/Admin/Manageschools";
import Districts from "./views/Admin/ManageDistricts";
import ManageDivisions from "./views/Admin/ManageDivisions";
import ManageStudents from "./views/Admin/Managestudents";
import AcademicManager from "./views/Admin/AcademicYear";
import Dashboard from "./views/Dashboard";

const router = createHashRouter([
    {
        path: "/",
        element: <AppShell />,
        children: [
            { path: "", element: <Login /> },
            { path: "dashboard", element: <Dashboard /> },

        ]
    },
    {
        path: "/admin",
        element: <AdminAppShell />,
        children: [
            { path: "", element: <AdminLogin /> },
            { path: "login", element: <AdminLogin /> },
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "manageschools", element: <ManageSchool /> },
            { path: "managedistricts", element: <Districts /> },
            { path: "managedivisions", element: <ManageDivisions /> },
            { path: "managestudents", element: <ManageStudents /> },
            { path: "manageacademicyear", element: <AcademicManager /> },

        ]
    },



]);

export default router;