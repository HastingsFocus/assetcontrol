import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen">

      {/* =========================
          SIDEBAR
      ========================= */}
      <div className="w-64 bg-gray-900 text-white p-4">

        <h2 className="text-xl font-bold mb-6">
          Super Admin Panel 👑
        </h2>

        {/* DASHBOARD */}
        <NavLink
          to="/super-admin/dashboard"
          className={({ isActive }) =>
            `block py-2 px-3 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Dashboard
        </NavLink>

        {/* USERS */}
        <NavLink
          to="/super-admin/users"
          className={({ isActive }) =>
            `block py-2 px-3 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Users
        </NavLink>

        {/* REQUESTS */}
        <NavLink
          to="/super-admin/requests"
          className={({ isActive }) =>
            `block py-2 px-3 rounded ${
              isActive ? "bg-gray-700" : "hover:bg-gray-700"
            }`
          }
        >
          Requests
        </NavLink>

        {/* 👑 SUPER ADMIN ONLY */}
        {user?.role === "super_admin" && (
          <>
            <NavLink
              to="/super-admin/logs"
              className={({ isActive }) =>
                `block py-2 px-3 rounded ${
                  isActive ? "bg-gray-700" : "hover:bg-gray-700"
                }`
              }
            >
              Activity Logs
            </NavLink>

            <NavLink
              to="/super-admin/analytics"
              className={({ isActive }) =>
                `block py-2 px-3 rounded ${
                  isActive ? "bg-gray-700" : "hover:bg-gray-700"
                }`
              }
            >
              Analytics
            </NavLink>
          </>
        )}

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="mt-6 w-full bg-red-500 py-2 rounded"
        >
          Logout
        </button>

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}
      <div className="flex-1 bg-gray-100 p-6 overflow-auto">

        <Outlet />

      </div>

    </div>
  );
}