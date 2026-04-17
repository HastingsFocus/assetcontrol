import { useState, useEffect } from "react";
import RequisitionForm from "../components/RequisitionForm";
import MyRequests from "../components/MyRequests";
import socket from "../socket";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [active, setActive] = useState("requisition");
  const [notifications, setNotifications] = useState([]);

  // 🔥 SOCKET SETUP
  useEffect(() => {
    if (user) {
      socket.emit("register", user._id);

      socket.on("notification", (data) => {
        console.log("New notification:", data);

        setNotifications((prev) => [data, ...prev]);
      });
    }

    return () => {
      socket.off("notification");
    };
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* 🟦 SIDEBAR */}
      <div
        style={{
          width: "250px",
          background: "#1f2937",
          color: "white",
          padding: "20px",
        }}
      >
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
        </div>
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