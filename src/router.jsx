import React from "react";
import { createHashRouter } from "react-router-dom";
import AppShell from "./layout/Appshell";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminLogin from "./views/Admin/AdminAuth/AdminLogin";
import Login from "./views/Auth/login";
import AdminDashboard from "./views/Admin/Dashboard";
import ManageDivision from "./views/Admin/Managedivision";
import ManageDistrict from "./views/Admin/ManageDistrict";
import ManageSchool from "./views/Admin/Manageschool";
import ManageUser from "./views/Admin/Manageuser";
import ManageStudents from "./views/Admin/Managestudents";
import Reports from "./views/Admin/Reports"; 
import Notifications from "./views/Admin/Notifications";
import Accademicperformance from "./views/Admin/AcademicPerformance";
import DistrictManagement from "./views/Admin/ManageDistrict";

 

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
            {path: "managedivision", element: <ManageDivision /> },
            {path: "managedistrict", element: <ManageDistrict /> },
            { path: "manageschool", element: <ManageSchool /> },
            {path: "managestudents", element: <ManageStudents /> },
            {path: "Accademicperformance", element: <Accademicperformance /> },
            {path: "reports", element: <Reports /> },
            {path: "notifications", element: <Notifications /> },
        ]
    },

      

]);

export default router;