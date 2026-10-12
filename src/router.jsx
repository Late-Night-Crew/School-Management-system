import React from "react";
import { createHashRouter } from "react-router-dom";

import UnifiedAppShell from "./layout/UnifiedAppShell";
import UnifiedLogin from "./views/Auth/UnifiedLogin";

import Dashboard from "./views/Dashboard";

// ADMIN
import AdminDashboard from "./views/Admin/Dashboard";
import ManageSchool from "./views/Admin/Manageschools";
import Districts from "./views/Admin/ManageDistricts";
import ManageDivisions from "./views/Admin/ManageDivisions";
import AcademicManager from "./views/Admin/AcademicYear";
import ManageStudents from "./views/Admin/Managestudents";
import ManageTransfers from "./views/Admin/Transfers";
import AdminReports from "./views/Admin/Reports";
import AdminNotifications from "./views/Admin/Notifications";
import Users from "./views/Admin/Users";

// REGIONAL
import RegionalDashboard from "./views/Regional/Dashboard";
import RegionalDistricts from "./views/Regional/Districts";
import RegionalSchools from "./views/Regional/Schools";
import RegionalStudents from "./views/Regional/Students";
import RegionalTransfers from "./views/Regional/Transfers";
import RegionalReports from "./views/Regional/Reports";
import RegionalSettings from "./views/Regional/Settings";
import RegionalNotifications from "./views/Regional/Notifications";

// SCHOOL
import SchoolDashboard from "./views/School/Dashboard";
import AddSubjects from "./views/School/AddSubjects";
import AcademicYear from "./views/School/AcademicYear";
import SchoolTransfers from "./views/School/Transfers";
import SchoolReports from "./views/School/Reports";
import SchoolSettings from "./views/School/Settings";
import SchoolNotifications from "./views/School/Notifications";
import StudentEnroll from "./views/School/StudentEnroll";
import Students from "./views/School/Students";
import EnterMarks from "./views/School/EnterMarks";

const router = createHashRouter([
  {
    path: "/login",
    element: <UnifiedLogin />,
  },

  {
    path: "/",
    element: <UnifiedAppShell />,
    children: [
      // ROOT
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },

      // ADMIN (no ID needed)
      {
        path: "admin",
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "managedivisions", element: <ManageDivisions /> },
          { path: "managedistricts", element: <Districts /> },
          { path: "manageschools", element: <ManageSchool /> },
          { path: "manageacademicyear", element: <AcademicManager /> },
          { path: "managestudents", element: <ManageStudents /> },
          { path: "transfers", element: <ManageTransfers /> },
          { path: "reports", element: <AdminReports /> },
          { path: "notifications", element: <AdminNotifications /> },
          {path: "users", element: <Users />}
        ],
      },

      // REGIONAL (with ID)
      {
        path: "regional/:regionalId",
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

      // SCHOOL (with ID)
      {
        path: "school/:schoolId",
        children: [
          { index: true, element: <SchoolDashboard /> },
          { path: "dashboard", element: <SchoolDashboard /> },
          { path: "academicyear", element: <AcademicYear /> },
          { path: "register", element: <StudentEnroll /> },
          { path: "students", element: <Students /> },
          { path: "marks", element: <EnterMarks /> },
          { path: "transfers", element: <SchoolTransfers /> },
          { path: "reports", element: <SchoolReports /> },
          { path: "notifications", element: <SchoolNotifications /> },
          { path: "settings", element: <SchoolSettings /> },
          { path: "addsubjects", element: <AddSubjects /> },
        ],
      },
    ],
  },
]);

export default router;