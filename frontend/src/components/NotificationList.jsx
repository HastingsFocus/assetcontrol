import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleView = (requestId) => {
    if (!requestId) return;

    // 🔥 redirect to admin page with requestId
    navigate(`/admin?requestId=${requestId}`);
  };

  return (
    <div>
      <h3>🔔 Notifications</h3>

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
            }}
          >
            <p>{n.message}</p>

            {/* 🔥 VIEW MORE BUTTON */}
            {n.request && (
              <button onClick={() => handleView(n.request)}>
                View More
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}