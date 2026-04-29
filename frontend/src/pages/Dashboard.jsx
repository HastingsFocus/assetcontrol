import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RequisitionForm from "../components/RequisitionForm";
import MyRequests from "../components/MyRequests";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth(); 
  const navigate = useNavigate();

  const [active, setActive] = useState("requisition");
  const [notifications, setNotifications] = useState([]);

  // =========================
  // 🔥 LOAD NOTIFICATIONS (PERSISTED)
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data);
      } catch (err) {
        console.log("❌ Failed to load notifications");
      }
    };

    fetchNotifications();
  }, [user]);

  // =========================
  // 🔥 SOCKET REAL-TIME UPDATES
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;

        return [data, ...prev];
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user]);

  // =========================
  // 🚪 LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.disconnect();
    navigate("/login");
  };

  // =========================
  // ⏳ LOADING GUARD
  // =========================
  if (loading || !user) {
    return <p style={{ padding: 20 }}>Loading dashboard...</p>;
  }

  // =========================
  // 🔥 UNREAD COUNT
  // =========================
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🟦 SIDEBAR */}
      <div
        style={{
          width: "250px",
          background: "#1f2937",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >

        <div>
          <h3 style={{ marginBottom: "5px" }}>
            👤 {user?.name}
          </h3>

          <p style={{ fontSize: "12px", opacity: 0.7 }}>
            {user?.email}
          </p>

          <hr />

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <button onClick={() => setActive("requisition")}>
              📦 Place Requisition
            </button>

            <button onClick={() => setActive("myRequests")}>
              📋 My Requests
            </button>

            {/* 🔥 UNREAD BADGE */}
            <button onClick={() => setActive("notifications")}>
              🔔 Notifications ({unreadCount})
            </button>

            <button onClick={() => navigate("/edit-inventory")}>
              ✏️ Edit Inventory
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* 🟩 MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px" }}>

        {active === "requisition" && <RequisitionForm />}

        {active === "myRequests" && <MyRequests />}

        {active === "notifications" && (
          <div>
            <h2>🔔 Notifications</h2>

            {notifications.length === 0 ? (
              <p>No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    padding: "10px",
                    margin: "10px 0",
                    borderRadius: "6px",

                    // 🔥 READ / UNREAD VISUAL
                    background: n.isRead ? "#f3f4f6" : "#ffffff",
                    borderLeft: n.isRead
                      ? "4px solid #9ca3af"
                      : "4px solid #2563eb",

                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <p style={{ margin: 0 }}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}