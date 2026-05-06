import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AllRequests from "../../components/AllRequests";
import InventoryOverview from "../../components/InventoryOverview";
import socket from "../../socket";
import useNotifications from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState("assets");
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // =========================
  // AUTO SWITCH TAB FROM URL
  // =========================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("requestId")) setActive("requests");
  }, [location.search]);

  // =========================
  // MARK ALL AS READ ON OPEN
  // =========================
  useEffect(() => {
    if (active !== "notifications") return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => markAsRead(id));
  }, [active, notifications, markAsRead]);

  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    navigate("/login");
  };

  const handleViewRequest = (requestId) => {
    if (!requestId) return;
    setActive("requests");
    navigate({ pathname: "/admin", search: `?requestId=${requestId}` });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatNotificationTime = (date) => {
    const now = new Date();
    const created = new Date(date);
    const isToday = created.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = created.toDateString() === yesterday.toDateString();

    if (isToday) return created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isYesterday) return "Yesterday";
    return created.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  };

  const navItems = [
    {
      id: "assets",
      label: "Inventory Overview",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: "requests",
      label: "All Requests",
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
          <span className="mt-2 inline-block text-xs bg-blue-500/90 text-white px-2.5 py-0.5 rounded-md font-semibold ring-1 ring-blue-300/60 shadow-sm">
            {user?.role?.toUpperCase()}
          </span>
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
                <span className="bg-blue-300 text-blue-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
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
              {active === "assets" && "Inventory Overview"}
              {active === "requests" && "All Requests"}
              {active === "notifications" && "Notifications"}
            </h1>
            <p className="text-xs text-zinc-500">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => setActive("notifications")}
              className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
              </svg>
              {unreadCount} unread
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full w-full justify-center px-4 py-10 sm:px-8 items-start">
            <div className="w-full max-w-6xl">
          {active === "assets" && <InventoryOverview />}

          {active === "requests" && (
            <AllRequests
              highlightId={new URLSearchParams(location.search).get("requestId")}
            />
          )}

          {active === "notifications" && (
            <div className="mx-auto w-full max-w-2xl">
              {notifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 rounded-xl shadow-sm border-l-4 ${
                        n.isRead
                          ? "bg-white border-gray-200"
                          : "bg-blue-50/90 border-blue-500 ring-1 ring-blue-500/15"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700">
                            {n.department || "System"}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatNotificationTime(n.createdAt)}
                        </span>
                      </div>

                      {n.request && (
                        <button
                          onClick={() => {
                            markAsRead(n._id);
                            handleViewRequest(n.request);
                          }}
                          className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
                        >
                          View Request
                        </button>
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
