import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  // =========================
  // LOAD NOTIFICATIONS
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data);
      } catch {
        console.log("Failed to load notifications");
      }
    };

    fetchNotifications();
  }, [user]);

  // =========================
  // MARK AS READ WHEN OPENING PAGE
  // =========================
  useEffect(() => {
    if (
      !user?._id ||
      !location.pathname.includes("notifications")
    )
      return;

    const markRead = async () => {
      try {
        await API.put("/notifications/read");

        // update UI immediately
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
          }))
        );
      } catch (err) {
        console.log("Failed to mark notifications");
      }
    };

    markRead();
  }, [location.pathname, user]);

  // =========================
  // SOCKET REAL-TIME
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n._id === data._id
        );

        if (exists) return prev;

        return [data, ...prev];
      });
    };

    socket.on("notification", handleNotification);

    return () =>
      socket.off(
        "notification",
        handleNotification
      );
  }, [user]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const unreadCount =
    notifications.filter(
      (n) => !n.isRead
    ).length;

  return (
    <div className="min-h-screen bg-zinc-50">

      <header className="bg-white border-b px-8 py-4 flex justify-between">

        <h1>
          Dashboard
        </h1>

        {unreadCount > 0 && (
          <button
            onClick={() =>
              navigate(
                "/dashboard/notifications"
              )
            }
            className="bg-amber-50 px-3 py-2 rounded"
          >
            {unreadCount} unread
          </button>
        )}

      </header>

      <div className="px-6 py-8">
        <Outlet />
      </div>

    </div>
  );
}