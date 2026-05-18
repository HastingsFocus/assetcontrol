import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";
import RoleGuard from "./guards/RoleGuard";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

// USER PAGES
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SetUpInventory from "./pages/SetUpInventory";
import EditInventory from "./pages/EditInventory";

// USER COMPONENTS
import Notifications from "./components/Notifications";
import RequisitionForm from "./components/RequisitionForm";
import MyRequests from "./components/MyRequests";

// ADMIN PAGES
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/users/Users";
import Requests from "./pages/admin/requests/Requests";
import Logs from "./pages/admin/logs/Logs";

// SUPER ADMIN DASHBOARD (optional separate page)
import SuperAdminDashboard from "./pages/admin/dashboard/AdminDashboard";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "admin" || user.role === "super_admin"
                    ? "/admin"
                    : "/dashboard"
                }
              />
            ) : (
              <Login />
            )
          }
        />

        <Route path="/register" element={<Register />} />

        {/* =========================
            USER SYSTEM
        ========================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedDashboard>
              <DashboardLayout />
            </ProtectedDashboard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="requisition" element={<RequisitionForm />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="edit-inventory" element={<EditInventory />} />
          <Route path="setup-inventory" element={<SetUpInventory />} />
        </Route>

        {/* =========================
            ADMIN + SUPER ADMIN SYSTEM
        ========================= */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={["admin", "super_admin"]}>
              <ProtectedDashboard>
                <AdminLayout />
              </ProtectedDashboard>
            </RoleGuard>
          }
        >
          {/* default page */}
          <Route
            index
            element={
              <Navigate to="dashboard" replace />
            }
          />

          {/* admin dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* shared admin pages */}
          <Route path="users" element={<Users />} />
          <Route path="requests" element={<Requests />} />

          {/* super admin only pages (you can guard inside component too) */}
          <Route path="logs" element={<Logs />} />
        </Route>

      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;