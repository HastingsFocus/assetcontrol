import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../socket";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // 📦 FETCH NOTIFICATIONS
  // =========================
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching notifications...");

      const res = await API.get("/notifications");

      console.log("🔔 RESPONSE DATA:", res.data);

      setNotifications(res.data);
    } catch (err) {
      console.log("❌ FAILED:", err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🔄 SOCKET + INITIAL LOAD
  // =========================
  useEffect(() => {
    console.log("🔥 COMPONENT MOUNTED");

    fetchNotifications();

    // 🔥 SOCKET LISTENER (PAGE LEVEL DEBUG)
    const handleNotification = (data) => {
      console.log("🔔 PAGE RECEIVED:", data);

      setNotifications((prev) => [data, ...prev]);
    };

    socket.on("notification", handleNotification);

    return () => {
      console.log("🧹 Cleaning socket listener");
      socket.off("notification", handleNotification);
    };
  }, []);

  // =========================
  // ✔ MARK AS READ
  // =========================
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.log("❌ Mark read failed", err);
    }
  };

  console.log("🧠 CURRENT STATE:", notifications);

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
          <p>{n.message}</p>
          <small>
            {n.createdAt
              ? new Date(n.createdAt).toLocaleString()
              : "No date"}
          </small>
        </div>
      ))}
    </div>
  );
}