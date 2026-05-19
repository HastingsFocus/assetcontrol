import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";
import RoleGuard from "./guards/RoleGuard";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

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

// ADMIN
import AdminDashboard from "./pages/admin/AdminDashboard";

// TOAST
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "admin"
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

        {/* USER SYSTEM */}
        <Route
          path="/dashboard"
          element={
            <ProtectedDashboard>
              <DashboardLayout />
            </ProtectedDashboard>
          }
        >
          <Route index element={<RequisitionForm />} />
          <Route path="requisition" element={<RequisitionForm />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="edit-inventory" element={<EditInventory />} />
          <Route path="setup-inventory" element={<SetUpInventory />} />
        </Route>

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <ProtectedDashboard>
                <AdminDashboard />
              </ProtectedDashboard>
            </RoleGuard>
          }
        />

      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;