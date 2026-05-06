import useNotifications from "../hooks/useNotifications";

export default function NotificationList() {
  const { notifications } = useNotifications();

  // =========================
  // 📅 FORMAT TIME
  // =========================
  const formatTime = (date) => {
    if (!date) return "No time";

    const d = new Date(date);
    const now = new Date();

    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3>🔔 Notifications</h3>

      {!Array.isArray(notifications) || notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n._id}
            style={{
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",

              // 🔥 UNREAD HIGHLIGHT
              background: n.isRead ? "#f9fafb" : "#e6f7ff",
              borderLeft: n.isRead
                ? "4px solid #d1d5db"
                : "4px solid #2563eb",
            }}
          >
            {/* TOP ROW */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                marginBottom: "5px",
              }}
            >
              <strong>{n.department ?? "System"}</strong>

              <span style={{ color: "gray" }}>
                {formatTime(n.createdAt)}
              </span>
            </div>

            {/* MESSAGE */}
            <div style={{ fontSize: "14px" }}>
              {n.message}
            </div>
          </div>
        ))
      )}
    </div>
  );
}