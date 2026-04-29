import Notification from "../models/Notification.js";

// 🔔 Get notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    // 🔐 SAFETY CHECK
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Unauthorized - user not found in request",
      });
    }

    const userId = req.user._id;

    console.log("📡 Fetching notifications for user:", userId);

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean(); // 🚀 faster read-only response

    console.log("📦 Notifications found:", notifications.length);

    return res.status(200).json(notifications);

  } catch (err) {
    console.log("❌ getNotifications error:", err);

    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: err.message,
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};