import React from "react";
import { Link, useLocation, } from "react-router-dom";
// import { AUTH_TOKEN_KEY } from "../constants/storageKeys";

export default function AdminSidebar() {
  const location = useLocation();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem(AUTH_TOKEN_KEY);
//     navigate("/admin/login");
//   };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Manage School", path: "/admin/ManageSchool" },
    { name: "Manage Students", path: "/admin/ManageStudents" },
    // { name: "Orders", path: "/admin/orders" },
    // { name: "Users", path: "/admin/users" },
    { name: "Tables", path: "/admin/Tables" },
    { name: "Notifications", path: "/admin/Notifications" },
    { name: "Reports", path: "/admin/Reports" },
    // { name: "Profile", path: "/admin/profile" },
  ];

  return (
    <aside
      className="d-flex flex-column vh-100 bg-dark text-light shadow-sm"
    >
      {/* Sidebar Header */}
      <div className="px-4 py-4 border-bottom border-secondary">
        <h4 className="m-0 fw-semibold">Admin Panel</h4>
      </div>

      {/* Menu Links */}
      <nav className="mt-2">
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item" key={item.name}>
              <Link
                to={item.path}
                className={`nav-link px-4 py-3 text-light fw-medium ${location.pathname === item.path
                    ? "bg-secondary text-white rounded-start"
                    : "text-light"
                  }`}
                style={{ transition: "background 0.2s" }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="border-top border-secondary mt-auto">
        <button
        //   onClick={handleLogout}
          className="btn btn-danger w-100 rounded-0 py-3 fw-semibold"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
