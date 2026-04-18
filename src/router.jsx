import React from "react";
import { createHashRouter } from "react-router-dom";
import UnifiedAppShell from "./layout/UnifiedAppShell";
import UnifiedLogin from "./views/Auth/UnifiedLogin";
import Dashboard from "./views/Dashboard";
import AdminAppShell from "./views/Admin/layout/AdminAppShell";
import AdminDashboard from "./views/Admin/Dashboard";
import ManageSchool from "./views/Admin/Manageschools";
import Districts from "./views/Admin/ManageDistricts";
import ManageDivisions from "./views/Admin/ManageDivisions";
import AcademicManager from "./views/Admin/AcademicYear";
import ManageStudents from "./views/Admin/Managestudents";
import ManageTransfers from "./views/Admin/Transfers";
import RegionalAppShell from "./views/Regional/layout/RegionalAppShell";
import RegionalDashboard from "./views/Regional/Dashboard";
import RegionalDistricts from "./views/Regional/Districts";
import RegionalSchools from "./views/Regional/Schools";
import RegionalStudents from "./views/Regional/Students";
import RegionalTransfers from "./views/Regional/Transfers";
import RegionalReports from "./views/Regional/Reports";
import RegionalSettings from "./views/Regional/Settings";
import RegionalNotifications from "./views/Regional/Notifications";
import SchoolAppShell from "./views/School/layout/SchoolAppShell";
import SchoolDashboard from "./views/School/Dashboard";
import SchoolTransfers from "./views/School/Transfers";
import SchoolReports from "./views/School/Reports";
import SchoolSettings from "./views/School/Settings";
import SchoolNotifications from "./views/School/Notifications";
import StudentEnroll from "./views/School/StudentEnroll";
import AddSubjects from "./views/School/AddSubjects";
import EnterMarks from "./views/School/EnterMarks";

const router = createHashRouter([
  // Login page (no sidebar)
  {
    path: "/login",
    element: <UnifiedLogin />,
  },

  {
    path: "/admin",
    element: <AdminAppShell />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "managedivisions", element: <ManageDivisions /> },
      { path: "managedistricts", element: <Districts /> },
      { path: "manageschools", element: <ManageSchool /> },
      { path: "manageacademicyear", element: <AcademicManager /> },
      { path: "managestudents", element: <ManageStudents /> },
      { path: "transfers", element: <ManageTransfers /> },
    ],
  },
  {
    path: "/regional",
    element: <RegionalAppShell />,
    children: [
      { index: true, element: <RegionalDashboard /> },
      { path: "dashboard", element: <RegionalDashboard /> },
      { path: "districts", element: <RegionalDistricts /> },
      { path: "schools", element: <RegionalSchools /> },
      { path: "students", element: <RegionalStudents /> },
      { path: "transfers", element: <RegionalTransfers /> },
      { path: "reports", element: <RegionalReports /> },
      { path: "settings", element: <RegionalSettings /> },
      { path: "notifications", element: <RegionalNotifications /> },
    ],
  },
  {
    path: "/school",
    element: <SchoolAppShell />,
    children: [
      { index: true, element: <SchoolDashboard /> },
      { path: "dashboard", element: <SchoolDashboard /> },
      { path: "student-enroll", element: <StudentEnroll /> },
      { path: "add-subjects", element: <AddSubjects /> },
      { path: "enter-marks", element: <EnterMarks /> },
      { path: "transfers", element: <SchoolTransfers /> },
      { path: "reports", element: <SchoolReports /> },
      { path: "settings", element: <SchoolSettings /> },
      { path: "notifications", element: <SchoolNotifications /> },
    ],
  },
  {
    path: "/",
    element: <UnifiedAppShell />,
    children: [
      { path: "", element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
    ],
  },
]);

export default router;