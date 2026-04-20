import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AllRequests from "../../components/AllRequests";
import InventoryOverview from "../../components/InventoryOverview";
import socket from "../../socket";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const [active, setActive] = useState("assets");
  const [notifications, setNotifications] = useState([]);

  // 🔥 LOGOUT FUNCTION (REUSABLE LOGIC)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    socket.disconnect(); // 🔥 VERY IMPORTANT (prevents weird reconnect issues)

    navigate("/login");
  };

  // 🔥 SOCKET CONNECTION
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      setNotifications((prev) => [data, ...prev]);
      alert(`🔔 ${data.message}`);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [user]);

  // 🔥 VIEW REQUEST FROM NOTIFICATION
  const handleViewRequest = (requestId) => {
    if (!requestId) return;

    setActive("requests");
    navigate(`/admin?requestId=${requestId}`);
  };

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
          justifyContent: "space-between", // 🔥 PUSHES LOGOUT TO BOTTOM
        }}
      >
        {/* TOP SECTION */}
        <div>
          <h3>👤 {user?.name} (Admin)</h3>

          <hr />

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
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
              🔔 Notifications
              {notifications.length > 0 && (
                <span
                  style={{
                    marginLeft: "10px",
                    background: "red",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "12px",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 🔴 LOGOUT BUTTON (BOTTOM) */}
        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* 🟩 MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px" }}>

        {active === "assets" && <InventoryOverview />}

        {active === "requests" && (
          <AllRequests
            highlightId={
              new URLSearchParams(window.location.search).get("requestId")
            }
          />
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
                        cursor: "pointer",
                      }}
                    >
                      View More
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