import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import socket from "../socket";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const fetchedOnce = useRef(false);

  // =========================
  // 📥 FETCH NOTIFICATIONS
  // =========================
  const fetchNotifications = async () => {
    try {
      console.log("📡 Fetching notifications...");

      const res = await API.get("/notifications");

      console.log("📊 COUNT:", res.data.length);

      setNotifications(res.data); // no need for spread
    } catch (err) {
      console.log("❌ Fetch notifications error:", err);
    }
  };

  // =========================
  // 🔄 INIT + SOCKET
  // =========================
  useEffect(() => {
    if (fetchedOnce.current) return;

    fetchedOnce.current = true;

    fetchNotifications();

    const handleNotification = (data) => {
      console.log("🔔 SOCKET RECEIVED:", data);

      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;

        // 🔥 ensure new notifications are unread
        return [{ ...data, isRead: false }, ...prev];
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, []);

  // =========================
  // 🔥 MARK AS READ (CRITICAL FIX)
  // =========================
  const markAsRead = async (id) => {
    try {
      console.log("✅ Marking as read:", id);

      await API.put(`/notifications/${id}/read`);

      // 🔥 INSTANT UI UPDATE (THIS WAS YOUR MISSING LINK)
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.log("❌ markAsRead error:", err);
    }
  };

  return {
    notifications,
    markAsRead,
    refresh: fetchNotifications,
  };
}