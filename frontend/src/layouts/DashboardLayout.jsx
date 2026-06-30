import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import socket from "../services/socket";
import LogoutButton from "../components/LogOutButton";
import Logo from "../components/Logo";

const NAV_ITEMS = [
  {
    id: "requisition",
    label: "Place Requisition",
    path: "/dashboard/requisition",
    icon: "M12 4v16m8-8H4",
  },
  {
    id: "requests",
    label: "My Requests",
    path: "/dashboard/my-requests",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/dashboard/notifications",
    badge: true,
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    id: "inventory",
    label: "Edit Inventory",
    path: "/dashboard/edit-inventory",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
];

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // =========================
  // LOAD NOTIFICATIONS (ONCE)
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data);
      } catch {
        console.log("❌ Failed to load notifications");
      }
    };

    fetchNotifications();
  }, [user?._id]);

  // =========================
  // SOCKET (CLEAN SINGLE SETUP)
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        return exists ? prev : [data, ...prev];
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user?._id]);

  // Navigate and close the mobile drawer in one step.
  const go = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const TITLE_MAP = {
    "/dashboard/setup-inventory": "Inventory Setup",
  };
  const activeItem = NAV_ITEMS.find((i) => i.path === location.pathname);
  const pageTitle = activeItem?.label || TITLE_MAP[location.pathname] || "Dashboard";

  const SidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.08]">
        <Logo variant="light" size="md" />
      </div>

      {/* User card */}
      <div className="px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 ring-2 ring-slate-500/60 flex items-center justify-center text-sm font-bold uppercase text-white shadow-inner shrink-0">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-300/80 truncate">{user.email}</p>
          </div>
        </div>
        {user?.department && (
          <span className="mt-3 inline-block text-[11px] bg-blue-500/90 text-white px-2.5 py-0.5 rounded-md font-semibold ring-1 ring-blue-300/40 shadow-sm">
            {user.department}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => go(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-900/25 ring-1 ring-blue-300/30"
                  : "text-slate-200/80 hover:bg-slate-600/60 hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="bg-blue-300 text-blue-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/[0.08]">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 text-white border-r border-slate-300/20 shadow-lg shadow-slate-800/20">
        {SidebarContent}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[80%] flex flex-col bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 text-white shadow-2xl animate-[slideInRight_.25s_ease-out]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-10 shadow-sm shadow-zinc-900/5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100 transition"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 truncate">
                {pageTitle}
              </h1>
              <p className="hidden sm:block text-xs text-zinc-500">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => go("/dashboard/notifications")}
              className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
              </svg>
              <span className="hidden sm:inline">{unreadCount} unread</span>
              <span className="sm:hidden">{unreadCount}</span>
            </button>
          )}
        </header>

        {/* Routed page */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
