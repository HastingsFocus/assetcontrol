import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RequisitionForm from "../components/RequisitionForm";
import MyRequests from "../components/MyRequests";
import socket from "../socket";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const [active, setActive] = useState("requisition");
  const [notifications, setNotifications] = useState([]);

  // 🔥 LOGOUT FUNCTION (same as admin)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    socket.disconnect(); // 🔥 prevent multiple connections

    navigate("/login");
  };

  // 🔥 SOCKET SETUP
  useEffect(() => {
    if (user?._id) {
      socket.emit("register", user._id);

      const handleNotification = (data) => {
        console.log("New notification:", data);
        setNotifications((prev) => [data, ...prev]);
      };

      socket.on("notification", handleNotification);

      return () => {
        socket.off("notification", handleNotification);
      };
    }
  }, [user]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🟦 SIDEBAR */}
      <div
        style={{
          width: "250px",
          background: "#1f2937",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between", // 🔥 push logout down
        }}
      >

        {/* TOP */}
        <div>
          <h3 style={{ marginBottom: "20px" }}>
            👤 {user?.name}
          </h3>

          <hr />

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div
  style={{
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  }}
>
  <button onClick={() => setActive("requisition")}>
    📦 Place Requisition
  </button>

  <button onClick={() => setActive("myRequests")}>
    📋 My Requests
  </button>

  <button onClick={() => setActive("condition")}>
    🧾 Provide Asset Condition
  </button>

  <button onClick={() => setActive("notifications")}>
    🔔 Notifications ({notifications.length})
  </button>

  {/* 🔥 NEW BUTTON */}
  <button onClick={() => navigate("/edit-inventory")}>
    ✏️ Edit Inventory
  </button>
</div>
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

        {active === "requisition" && <RequisitionForm />}

        {active === "myRequests" && <MyRequests />}

        {active === "condition" && (
          <h2>🧾 Asset Condition Page</h2>
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
                    padding: "10px",
                    margin: "10px 0",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                  }}
                >
                  {n.message}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}