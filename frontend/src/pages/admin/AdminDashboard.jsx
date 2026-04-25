import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AllRequests from "../../components/AllRequests";
import InventoryOverview from "../../components/InventoryOverview";
import socket from "../../socket";
import API from "../../services/api";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState("assets");
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // =========================
  // 🔐 LOAD REAL USER (SAFE)
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.log("Session expired");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
      }
    };

    loadUser();
  }, [navigate]);

  // =========================
  // 🔥 SOCKET CONNECTION (SAFE)
  // =========================
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user]);

  // =========================
  // 🚪 LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    socket.disconnect();

    navigate("/login");
  };

  // =========================
  // 🔔 VIEW REQUEST FROM NOTIFICATION
  // =========================
  const handleViewRequest = (requestId) => {
    if (!requestId) return;

    setActive("requests");
    navigate(`/admin?requestId=${requestId}`);
  };

  // =========================
  // 🔄 LOADING STATE
  // =========================
  if (!user) {
    return <p style={{ padding: 20 }}>Loading admin dashboard...</p>;
  }

  const highlightId = new URLSearchParams(location.search).get("requestId");

  // =========================
  // UI
  // =========================
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🟦 SIDEBAR */}
      <div
        style={{
          width: "250px",
          background: "#111827",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >

        {/* TOP */}
        <div>
          <h3 style={{ marginBottom: "5px" }}>
  👤 {user?.name || "Admin"}
</h3>

<p style={{ fontSize: "12px", opacity: 0.7 }}>
  {user?.email}
</p>

<p style={{ fontSize: "12px", color: "#9ca3af" }}>
  {user?.role?.toUpperCase()}
</p>

          <hr />

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <button onClick={() => setActive("assets")}>
              📊 Inventory Overview
            </button>

            <button onClick={() => setActive("requests")}>
              📦 All Requests
            </button>

            <button onClick={() => setActive("reports")}>
              📈 Condition Reports
            </button>

            <button onClick={() => setActive("notifications")}>
              🔔 Notifications ({notifications.length})
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* 🟩 MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px" }}>

        {active === "assets" && <InventoryOverview />}

        {active === "requests" && (
          <AllRequests highlightId={highlightId} />
        )}

        {active === "reports" && (
          <h2>📈 Condition Reports (Coming Soon)</h2>
        )}

        {active === "notifications" && (
          <div>
            <h2>🔔 Notifications</h2>

            {notifications.length === 0 ? (
              <p>No notifications yet</p>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                    background: "#f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{n.message}</span>

                  {n.request && (
                    <button
                      onClick={() => handleViewRequest(n.request)}
                      style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                      }}
                    >
                      View
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}