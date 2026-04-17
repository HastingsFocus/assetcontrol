import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AllRequests from "../../components/AllRequests";
import socket from "../../socket";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [active, setActive] = useState("requests");
  const [notifications, setNotifications] = useState([]);

  // 🔥 SOCKET CONNECTION
  useEffect(() => {
    if (!user?._id) return;

    console.log("🟢 Admin connecting to socket:", user._id);

    socket.emit("register", user._id);

    const handleNotification = (data) => {
      console.log("🔥 Admin RECEIVED notification:", data);

      // ✅ Add to notifications list
      setNotifications((prev) => [data, ...prev]);

      // 🚀 OPTIONAL: instant alert (you can remove later)
      alert(`🔔 ${data.message}`);
    };

    socket.on("notification", handleNotification);

    return () => {
      console.log("🔌 Admin socket cleanup");
      socket.off("notification", handleNotification);
    };
  }, [user]);

  // 🔥 VIEW REQUEST FROM NOTIFICATION
  const handleViewRequest = (requestId) => {
    if (!requestId) return;

    // switch to requests tab
    setActive("requests");

    // pass requestId via URL
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
        }}
      >
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
          <button onClick={() => setActive("requests")}>
            📦 All Requests
          </button>

          <button onClick={() => setActive("assets")}>
            🪑 Manage Assets
          </button>

          <button onClick={() => setActive("reports")}>
            📊 Condition Reports
          </button>

          {/* 🔔 NOTIFICATIONS TAB */}
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

      {/* 🟩 MAIN */}
      <div style={{ flex: 1, padding: "20px" }}>

        {/* 📦 REQUESTS */}
        {active === "requests" && (
          <AllRequests
            highlightId={
              new URLSearchParams(window.location.search).get("requestId")
            }
          />
        )}

        {/* 🪑 ASSETS */}
        {active === "assets" && <h2>🪑 Manage Assets</h2>}

        {/* 📊 REPORTS */}
        {active === "reports" && <h2>📊 Condition Reports</h2>}

        {/* 🔔 NOTIFICATIONS */}
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

                  {/* 🔥 VIEW MORE BUTTON */}
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