import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import API from "./services/api";
import socket from "./services/socket";
import { useAuth } from "./context/AuthContext";

// 🔐 Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";

// 🔔 Pages
import Notifications from "./components/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetUpInventory from "./pages/SetUpInventory.jsx";
import EditInventory from "./pages/EditInventory";

// 🔔 Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, token, login, logout } = useAuth();

  // =========================
  // 🔐 SESSION RESTORE + SOCKET REGISTER
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      if (!token) return;

      try {
        const res = await API.get("/auth/me");
        const userData = res.data.user;

        login({ user: userData, token });

        // 🔥 REGISTER SOCKET (FIXED)
        if (userData?._id) {
          socket.emit("register", userData._id.toString());
          console.log("🟢 Socket registered:", userData._id.toString());
        }

      } catch (err) {
        console.log("❌ Session expired");
        logout();
      }
    };

    loadUser();
  }, [token]);

  // =========================
  // 🔔 GLOBAL SOCKET LISTENER (IMPORTANT FIX)
  // =========================
  useEffect(() => {
    const handleNotification = (data) => {
      console.log("🔥 GLOBAL SOCKET RECEIVED:", data);
      toast.info(data.message);
    };

    console.log("🟡 Registering global notification listener");

    socket.on("notification", handleNotification);

    return () => {
      console.log("🧹 Removing global notification listener");
      socket.off("notification", handleNotification);
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* =========================
              🔥 PUBLIC ROUTES
          ========================= */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* =========================
              🔐 INVENTORY SETUP
          ========================= */}
          <Route
            path="/setup-inventory"
            element={
              <ProtectedDashboard>
                <SetUpInventory />
              </ProtectedDashboard>
            }
          />

          <Route
            path="/edit-inventory"
            element={
              <ProtectedDashboard>
                <EditInventory />
              </ProtectedDashboard>
            }
          />

          {/* =========================
              🔥 USER DASHBOARD
          ========================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedDashboard>
                <Dashboard />
              </ProtectedDashboard>
            }
          />

          {/* =========================
              🔔 NOTIFICATIONS PAGE
          ========================= */}
          <Route
            path="/notifications"
            element={
              <ProtectedDashboard>
                <Notifications />
              </ProtectedDashboard>
            }
          />

          {/* =========================
              🔥 ADMIN DASHBOARD
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

      {/* 🔔 TOAST UI */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;