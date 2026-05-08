import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import API from "./services/api";
import socket from "./services/socket";
import { useAuth } from "./context/AuthContext";

// 🔐 Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";

// 🔥 Layout
import DashboardLayout from "./layouts/DashboardLayout";

// 🔔 Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetUpInventory from "./pages/SetUpInventory";
import EditInventory from "./pages/EditInventory";

// 🔥 Components
import Notifications from "./components/Notifications";
import RequisitionForm from "./components/RequisitionForm";
import MyRequests from "./components/MyRequests";

// 🔔 Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, token, login, logout } = useAuth();

  // =========================
  // SESSION RESTORE + SOCKET REGISTER
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      if (!token) return;

      try {
        const res = await API.get("/auth/me");
        const userData = res.data.user;

        login({ user: userData, token });

        if (userData?._id) {
          socket.emit("register", userData._id.toString());
        }
      } catch (err) {
        console.log("❌ Session expired");
        logout();
      }
    };

    loadUser();
  }, [token]);

  // =========================
  // GLOBAL SOCKET LISTENER
  // =========================
  useEffect(() => {
    const handleNotification = (data) => {
      console.log("🔥 GLOBAL SOCKET RECEIVED:", data);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* =========================
              PUBLIC ROUTES
          ========================= */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* =========================
              DASHBOARD LAYOUT (MASTER)
          ========================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedDashboard>
                <DashboardLayout />
              </ProtectedDashboard>
            }
          >

            {/* ALL CHILD ROUTES SHARE SAME LAYOUT */}

            <Route element={<Dashboard />}>
              
              {/* DEFAULT DASHBOARD */}
              <Route index element={<RequisitionForm />} />

              <Route path="requisition" element={<RequisitionForm />} />
              <Route path="my-requests" element={<MyRequests />} />
              <Route path="notifications" element={<Notifications />} />

              {/* MOVE THESE INSIDE DASHBOARD TREE */}
              <Route path="edit-inventory" element={<EditInventory />} />
              <Route path="setup-inventory" element={<SetUpInventory />} />

            </Route>

          </Route>

          {/* =========================
              ADMIN
          ========================= */}
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

      <ToastContainer
        position="top-right"
        autoClose={3000}
      />
    </>
  );
}

export default App;