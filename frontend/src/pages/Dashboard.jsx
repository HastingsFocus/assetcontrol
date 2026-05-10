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
      } catch (err) {
        console.log("❌ Failed to load notifications");
      }
    };

    fetchNotifications();
  }, [user]);

  // =========================
  // SOCKET REAL-TIME
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

    return () => socket.off("notification", handleNotification);
  }, [user]);

  // =========================
  // LOADING
  // =========================
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>

          <p className="text-gray-500 text-sm">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================
// PAGE TITLES
// =========================
let pageTitle = "Dashboard";

if (location.pathname.includes("requisition")) {
  pageTitle = "Place Requisition";
}

if (location.pathname.includes("my-requests")) {
  pageTitle = "My Requests";
}

if (location.pathname.includes("notifications")) {
  pageTitle = "Notifications";
}

if (location.pathname.includes("edit-inventory")) {
  pageTitle = "Edit Inventory";
}

  const unreadCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* TOP BAR */}
      <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            {pageTitle}
          </h1>

          <p className="text-xs text-zinc-500">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
            </svg>

            {unreadCount} unread
          </button>
        )}
      </header>

      {/* PAGE CONTENT */}
      <div className="px-6 py-8">
        <Outlet />
      </div>
    </div>
  );
}