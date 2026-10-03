import { createHashRouter } from "react-router-dom";

import UnifiedAppShell from "./layout/UnifiedAppShell";
import LoginPage from "./pages/auth/LoginPage";

// Super admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminTransfers from "./pages/admin/AdminTransfers";
import ManageAcademicYears from "./pages/admin/ManageAcademicYears";
import ManageDistricts from "./pages/admin/ManageDistricts";
import ManageDivisions from "./pages/admin/ManageDivisions";
import ManageSchools from "./pages/admin/ManageSchools";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageSubjects from "./pages/admin/ManageSubjects";

// Regional admin
import RegionalDashboard from "./pages/regional/RegionalDashboard";
import RegionalDistricts from "./pages/regional/RegionalDistricts";
import RegionalNotifications from "./pages/regional/RegionalNotifications";
import RegionalReports from "./pages/regional/RegionalReports";
import RegionalSchools from "./pages/regional/RegionalSchools";
import RegionalSettings from "./pages/regional/RegionalSettings";
import RegionalStudents from "./pages/regional/RegionalStudents";
import RegionalTransfers from "./pages/regional/RegionalTransfers";

// School manager
import EnterMarks from "./pages/school/EnterMarks";
import SchoolAcademicYears from "./pages/school/SchoolAcademicYears";
import SchoolDashboard from "./pages/school/SchoolDashboard";
import SchoolNotifications from "./pages/school/SchoolNotifications";
import SchoolReports from "./pages/school/SchoolReports";
import SchoolSettings from "./pages/school/SchoolSettings";
import SchoolStudents from "./pages/school/SchoolStudents";
import SchoolTransfers from "./pages/school/SchoolTransfers";
import StudentEnroll from "./pages/school/StudentEnroll";

// Every page except login renders inside UnifiedAppShell, which checks the session
// and redirects users away from pages outside their role (see auth/session.js).
// Sidebar links for each role are defined in layout/UnifiedSidebar.jsx.
const router = createHashRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <UnifiedAppShell />,
    children: [
      // Redirected to the user's role home page by UnifiedAppShell
      { index: true, element: null },
      { path: "dashboard", element: null },

      {
        path: "admin",
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "managedivisions", element: <ManageDivisions /> },
          { path: "managedistricts", element: <ManageDistricts /> },
          { path: "manageschools", element: <ManageSchools /> },
          { path: "manageacademicyear", element: <ManageAcademicYears /> },
          { path: "managestudents", element: <ManageStudents /> },
          { path: "managesubjects", element: <ManageSubjects /> },
          { path: "transfers", element: <AdminTransfers /> },
          { path: "reports", element: <AdminReports /> },
          { path: "notifications", element: <AdminNotifications /> },
        ],
      },

      {
        path: "regional/:regionId",
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
        path: "school/:schoolId",
        children: [
          { index: true, element: <SchoolDashboard /> },
          { path: "dashboard", element: <SchoolDashboard /> },
          { path: "academicyear", element: <SchoolAcademicYears /> },
          { path: "register", element: <StudentEnroll /> },
          { path: "students", element: <SchoolStudents /> },
          { path: "marks", element: <EnterMarks /> },
          { path: "transfers", element: <SchoolTransfers /> },
          { path: "reports", element: <SchoolReports /> },
          { path: "settings", element: <SchoolSettings /> },
          { path: "notifications", element: <SchoolNotifications /> },
        ],
      },
    ],
  },
]);

export default router;
