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

  const markNotificationAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.log("❌ Failed to mark notification as read");
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.disconnect();
    navigate("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    {
      id: "requisition",
      label: "Place Requisition",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      id: "myRequests",
      label: "My Requests",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      badge: unreadCount > 0 ? unreadCount : null,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 text-white flex flex-col flex-shrink-0 border-r border-slate-300/30 shadow-lg shadow-slate-800/20">

        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <p className="text-[11px] font-semibold text-blue-200/90 uppercase tracking-[0.14em] mb-1">
            St. Joseph's College
          </p>
          <h2 className="text-[15px] font-semibold text-zinc-100 leading-snug tracking-tight">
            Procurement System
          </h2>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 ring-2 ring-slate-500 flex items-center justify-center text-sm font-bold uppercase text-white shadow-inner">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-200/80 truncate">{user?.email}</p>
            </div>
          </div>
          {user?.department && (
            <span className="mt-2 inline-block text-xs bg-blue-500/20 text-blue-100 px-2.5 py-0.5 rounded-md ring-1 ring-blue-300/30">
              {user.department}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === item.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-900/25 ring-1 ring-blue-300/30"
                  : "text-slate-200/80 hover:bg-slate-600/60 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={() => navigate("/edit-inventory")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200/80 hover:bg-slate-600/60 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Inventory
          </button>
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-300/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-red-600/95 hover:bg-red-600 text-white shadow-sm ring-1 ring-red-500/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/90">

        {/* Top bar */}
        <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-8 py-4 flex items-center justify-between z-10 shadow-sm shadow-zinc-900/5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              {active === "requisition" && "Place Requisition"}
              {active === "myRequests" && "My Requests"}
              {active === "notifications" && "Notifications"}
            </h1>
            <p className="text-xs text-zinc-500">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => setActive("notifications")}
              className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
              </svg>
              {unreadCount} unread
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`flex min-h-full w-full justify-center px-4 py-10 sm:px-8 ${
              active === "requisition" ? "items-center" : "items-start"
            }`}
          >
            <div className="w-full max-w-5xl flex flex-col items-center">
          {active === "requisition" && <RequisitionForm />}
          {active === "myRequests" && <MyRequests />}

          {active === "notifications" && (
            <div className="w-full max-w-2xl">
              {notifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markNotificationAsRead(n._id)}
                      className={`relative p-4 rounded-xl shadow-sm border-l-4 transition-all ${
                        n.isRead
                          ? "bg-white border-gray-200 opacity-80"
                          : "bg-slate-50/90 border-slate-500 ring-1 ring-slate-500/15 cursor-pointer"
                      }`}
                    >
                      {!n.isRead && (
                        <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-slate-500 rounded-full shadow-sm shadow-slate-600/40" />
                      )}
                      <p className="text-sm text-gray-800">{n.message}</p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      )}
                      {!n.isRead && (
                        <p className="text-xs text-slate-600 font-medium mt-2">Click to mark as read</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
