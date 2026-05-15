import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/AuthContext";

// Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";

// Layout
import DashboardLayout from "./layouts/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetUpInventory from "./pages/SetUpInventory";
import EditInventory from "./pages/EditInventory";

// Components
import Notifications from "./components/Notifications";
import RequisitionForm from "./components/RequisitionForm";
import MyRequests from "./components/MyRequests";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user } = useAuth();

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* DASHBOARD */}
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

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedDashboard>
                {user?.role === "admin" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </ProtectedDashboard>
            }
          />

        </Routes>
      </BrowserRouter>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;