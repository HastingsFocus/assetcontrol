import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../socket";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // =========================
  // FETCH NOTIFICATIONS
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

  useEffect(() => {
    fetchNotifications();

    const handleNotification = (data) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [fetchNotifications]);

  // =========================
  // MARK AS READ
  // =========================
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.log("❌ Mark read failed", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markAsRead(n._id)));
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (date) => {
    if (!date) return "No date";
    const d = new Date(date);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">

      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-slate-700 via-slate-700 to-slate-600 text-white px-6 py-4 border-b border-slate-500/30">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="hidden h-10 w-px shrink-0 bg-white/20 sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100/90 mb-1">
              St. Joseph's College
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">

        {/* Actions bar */}
        {!loading && notifications.length > 0 && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-slate-700 hover:text-slate-800 font-medium transition"
              >
                Mark all as read
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-1">You'll see updates about your requests here.</p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markAsRead(n._id)}
                className={`relative p-4 rounded-xl border-l-4 shadow-sm cursor-pointer transition-all ${
                  n.isRead
                    ? "bg-white border-gray-200 opacity-80"
                    : "bg-slate-50/90 border-slate-500 ring-1 ring-slate-500/15"
                }`}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-slate-500 rounded-full shadow-sm shadow-slate-600/40"></div>
                )}

                <div className="flex items-start justify-between pr-6">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                  </div>
                </div>

                {!n.isRead && (
                  <p className="text-xs text-slate-600 font-medium mt-2">Click to mark as read</p>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
