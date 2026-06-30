import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import socket from "../services/socket";
import LogoutButton from "../components/LogOutButton";

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);

  const navItems = [
    { id: "requisition", label: "Place Requisition", path: "/dashboard/requisition" },
    { id: "requests", label: "My Requests", path: "/dashboard/my-requests" },
    { id: "notifications", label: "Notifications", path: "/dashboard/notifications", badge: true },
    { id: "inventory", label: "Edit Inventory", path: "/dashboard/edit-inventory" },
  ];

  // =========================
  // LOAD NOTIFICATIONS (ONCE)
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
  }, [user?._id]);

  // =========================
  // SOCKET (CLEAN SINGLE SETUP)
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    // connect once
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("register", user._id);
    console.log("📡 Socket registered:", user._id);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-700 text-white flex flex-col">

        <div className="p-4 border-b border-white/10">
          <h2 className="font-bold">Procurement System</h2>
        </div>

        <div className="p-4 border-b border-white/10">
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs">{user.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full text-left p-2 rounded ${
                  active ? "bg-blue-500" : "hover:bg-slate-600"
                }`}
              >
                {item.label}

                {item.badge && unreadCount > 0 && (
                  <span className="ml-2 bg-yellow-400 text-black px-2 rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
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