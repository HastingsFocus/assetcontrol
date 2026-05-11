import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import socket from "../services/socket";
import LogoutButton from "../components/LogOutButton";

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);

  // =========================
  // NAV ITEMS (NEW CLEAN STRUCTURE)
  // =========================
  const navItems = [
    { id: "requisition", label: "Place Requisition", path: "/dashboard/requisition" },
    { id: "requests", label: "My Requests", path: "/dashboard/my-requests" },
    { id: "notifications", label: "Notifications", path: "/dashboard/notifications", badge: true },
    { id: "inventory", label: "Edit Inventory", path: "/dashboard/edit-inventory" },
  ];

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
  // SOCKET
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 text-white flex flex-col border-r border-slate-300/30">

        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-[0.14em]">
            St. Joseph's College
          </p>
          <h2 className="text-[15px] font-semibold text-white">
            Procurement System
          </h2>
        </div>

        {/* User */}
        <div className="px-6 py-4 border-b border-white/10">
          <p className="font-semibold text-sm">{user.name}</p>
          <p className="text-xs text-slate-200">{user.email}</p>

          {user.department && (
            <span className="mt-2 inline-block text-xs bg-blue-500/20 text-blue-100 px-2 py-0.5 rounded">
              {user.department}
            </span>
          )}
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-500 text-white shadow-lg ring-1 ring-blue-300/30"
                    : "text-slate-200/80 hover:bg-slate-600/60 hover:text-white"
                }`}
              >
                <span>{item.label}</span>

                {item.badge && unreadCount > 0 && (
                  <span className="bg-amber-400 text-black text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="px-3 py-4 border-t border-slate-300/20">
          <LogoutButton />
        </div>

      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}