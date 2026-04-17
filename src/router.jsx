import React from "react";
import { createHashRouter } from "react-router-dom";
import UnifiedAppShell from "./layout/UnifiedAppShell";
import UnifiedLogin from "./views/Auth/UnifiedLogin";
import AdminDashboard from "./views/Admin/Dashboard";
import ManageSchool from "./views/Admin/Manageschools";
import Districts from "./views/Admin/ManageDistricts";
import ManageDivisions from "./views/Admin/ManageDivisions";
import ManageStudents from "./views/Admin/Managestudents";
import AcademicManager from "./views/Admin/AcademicYear";
import ManageTransfers from "./views/Admin/Transfers";
import Dashboard from "./views/Dashboard";

const router = createHashRouter([
  // Login page (no sidebar)
  {
    path: "/login",
    element: <UnifiedLogin />,
  },

  // All authenticated routes with unified sidebar
  {
    path: "/",
    element: <UnifiedAppShell />,
    children: [
      // Root dashboard
      { path: "", element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },

      // Admin routes
      { path: "admin/dashboard", element: <AdminDashboard /> },
      { path: "admin/manageschools", element: <ManageSchool /> },
      { path: "admin/managedistricts", element: <Districts /> },
      { path: "admin/managedivisions", element: <ManageDivisions /> },
      { path: "admin/managestudents", element: <ManageStudents /> },
      { path: "admin/manageacademicyear", element: <AcademicManager /> },
      { path: "admin/transfers", element: <ManageTransfers /> },

      // Regional routes
      { path: "regional/districts", element: <Districts /> },
      { path: "regional/schools", element: <ManageSchool /> },
      { path: "regional/students", element: <ManageStudents /> },
      { path: "regional/transfers", element: <ManageTransfers /> },

      // School routes
      { path: "school/transfers", element: <ManageTransfers /> },
    ],
  },
]);

export default router;