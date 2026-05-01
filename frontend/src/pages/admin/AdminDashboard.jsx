import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AllRequests from "../../components/AllRequests";
import InventoryOverview from "../../components/InventoryOverview";
import socket from "../../socket";
import API from "../../services/api";
import useNotifications from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user, loading } = useAuth(); 
  const [active, setActive] = useState("assets");

  const { notifications, markAsRead } = useNotifications();

  const navigate = useNavigate();
  const location = useLocation();

  // =========================
  // 🔥 AUTO SWITCH TAB FROM URL
  // =========================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get("requestId");

    if (requestId) {
      setActive("requests");
    }
  }, [location.search]);

  // =========================
  // 🚪 LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    navigate("/login");
  };

  // =========================
  // 🔔 VIEW REQUEST
  // =========================
  const handleViewRequest = (requestId) => {
    if (!requestId) return;

    setActive("requests");

    navigate({
      pathname: "/admin",
      search: `?requestId=${requestId}`,
    });
  };

  // =========================
  // ⏳ LOADING GUARD
  // =========================
  if (loading || !user) {
    return <p style={{ padding: 20 }}>Loading admin dashboard...</p>;
  }

  // =========================
  // 🔥 UNREAD COUNT
  // =========================
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // =========================
  // 🕒 FORMAT TIME
  // =========================
  const formatNotificationTime = (date) => {
    const now = new Date();
    const created = new Date(date);

    const isToday = created.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday = created.toDateString() === yesterday.toDateString();

    if (isToday) {
      return created.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (isYesterday) {
      return "Yesterday";
    }

    return created.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🟦 SIDEBAR */}
      <div
        style={{
          width: "250px",
          background: "#111827",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3>👤 {user.name}</h3>
          <p style={{ fontSize: "12px", opacity: 0.7 }}>
            {user.email}
          </p>
          <p style={{ fontSize: "12px", color: "#9ca3af" }}>
            {user.role?.toUpperCase()}
          </p>

          <hr />

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <button onClick={() => setActive("assets")}>
              📊 Inventory Overview
            </button>

            <button onClick={() => setActive("requests")}>
              📦 All Requests
            </button>

            <button onClick={() => setActive("notifications")}>
              🔔 Notifications ({unreadCount})
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
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* 🟩 MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px" }}>

        {active === "assets" && <InventoryOverview />}

        {active === "requests" && (
          <AllRequests highlightId={new URLSearchParams(location.search).get("requestId")} />
        )}

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
                    padding: "12px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    background: n.isRead ? "#f9fafb" : "#ffffff",
                    borderLeft: n.isRead
                      ? "4px solid #d1d5db"
                      : "4px solid #2563eb",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* HEADER */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <strong>{n.department || "System"}</strong>

                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>

                  {/* MESSAGE */}
                  <p style={{ margin: 0 }}>{n.message}</p>

                  {/* ACTION */}
                  {n.request && (
                    <button
                      onClick={() => {
                        markAsRead(n._id);
                        handleViewRequest(n.request);
                      }}
                      style={{
                        marginTop: "8px",
                        padding: "6px 10px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}