import React from "react";
import { createHashRouter } from "react-router-dom";
import AppShell from "./layout/Appshell";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminLogin from "./views/Admin/AdminAuth/AdminLogin";
import Login from "./views/Auth/login";
import AdminDashboard from "./views/Admin/Dashboard";
import ManageSchool from "./views/Admin/Manageschools";
import Districts from "./views/Admin/ManageDistricts";
import ManageDivisions from "./views/Admin/ManageDivisions";
import ManageStudents from "./views/Admin/Managestudents";
import Reports from "./views/Admin/Reports"; 
import Notifications from "./views/Admin/Notifications";
import ManageUser from "./views/Admin/Manageuser";
import Accademicperformance from "./views/Admin/AcademicPerformance";
 

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
            /*adminauth - admin login*/
            {path: "login", element: <AdminLogin /> },
            { path: "dashboard", element: <AdminDashboard /> },
            {path: "users", element: <ManageUser /> },
            { path: "manageschools", element: <ManageSchool /> },
            {path: "managedistricts", element: <Districts /> },
            {path: "managedivisions", element: <ManageDivisions /> },
            {path: "managestudents", element: <ManageStudents /> },
            {path: "Accademicperformance", element: <Accademicperformance /> },
            {path: "reports", element: <Reports /> },
            {path: "notifications", element: <Notifications /> },
        ]
    },

      

]);

export default router;