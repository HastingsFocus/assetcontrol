import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import socket from "./services/socket";

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SetUpInventory from "./pages/SetUpInventory.jsx"; // 🔥 ADDED

function App() {

  // 🔥 CONNECT USER TO SOCKET
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user?._id) {
      socket.emit("register", user._id);
      console.log("✅ Socket registered:", user._id);
    }

    // 🔔 LISTEN FOR NOTIFICATIONS
    socket.on("notification", (data) => {
      console.log("🔔 Notification:", data);

      toast.info(data.message);
    });

    return () => {
      socket.off("notification");
    };
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* 🔥 DEFAULT ROUTE */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔥 INVENTORY SETUP ROUTE */}
          <Route path="/setup-inventory" element={<SetUpInventory />} />

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>

      {/* 🔥 TOAST UI */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;