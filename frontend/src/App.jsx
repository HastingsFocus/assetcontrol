import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import API from "./services/api";
import socket from "./services/socket";
import { useAuth } from "./context/AuthContext";

// 🔐 Guards
import ProtectedDashboard from "./guards/ProtectedDashboards";

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetUpInventory from "./pages/SetUpInventory.jsx";
import EditInventory from "./pages/EditInventory";

function App() {
  const { user, token, login, logout } = useAuth();

  // =========================
  // 🔐 SESSION RESTORE
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      if (!token) return;

      try {
        const res = await API.get("/auth/me");
        const userData = res.data.user;

        login({ user: userData, token });

        if (userData?._id) {
          socket.emit("register", userData._id);
        }

      } catch (err) {
        console.log("❌ Session expired");
        logout();
      }
    };

    loadUser();
  }, [token]);

  // =========================
  // 🔔 SOCKET LISTENER
  // =========================
  useEffect(() => {
    const handleNotification = (data) => {
      toast.info(data.message);
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
              🔥 PUBLIC ROUTES
              ========================= */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* =========================
              🔐 PROTECTED INVENTORY SETUP
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
              🔥 PROTECTED DASHBOARD
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
              🔥 PROTECTED ADMIN
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

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;