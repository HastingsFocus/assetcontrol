import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../socket";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // 📦 FETCH NOTIFICATIONS
  // =========================
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      const res = await API.get("/notifications");

      setNotifications(res.data || []);
    } catch (err) {
      console.log("❌ FAILED:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================
  // 🔄 SOCKET + INIT
  // =========================
  useEffect(() => {
    fetchNotifications();

    const handleNotification = (data) => {
      console.log("🔔 PAGE RECEIVED:", data);

      setNotifications((prev) => {
        // 🔥 prevent duplicates
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;

        return [data, ...prev];
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [fetchNotifications]);

  // =========================
  // ✔ MARK AS READ (FIXED ROUTE)
  // =========================
  const markAsRead = async (id) => {
    try {
      // 🔥 FIXED ROUTE (your backend uses /read)
      await API.put(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.log("❌ Mark read failed", err);
    }
  };

  // =========================
  // 📅 FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "No date";

    const d = new Date(date);
    const now = new Date();

    const isToday =
      d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      <h2>🔔 Notifications</h2>

      {loading && <p>Loading...</p>}

      {!loading && notifications.length === 0 && (
        <p>No notifications yet</p>
      )}

      {notifications.map((n) => (
        <div
          key={n._id}
          onClick={() => markAsRead(n._id)}
          style={{
            padding: "12px",
            marginBottom: "10px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: n.isRead ? "#f8f8f8" : "#e6f7ff",
            cursor: "pointer",
          }}
        >
          <p style={{ margin: 0 }}>{n.message}</p>

          <small style={{ color: "#666" }}>
            {formatDate(n.createdAt)}
          </small>
        </div>
      ))}
    </div>
  );
}