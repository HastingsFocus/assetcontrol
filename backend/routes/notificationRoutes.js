import express from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notificationController.js";

import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔔 Get all notifications
router.get("/", protect, (req, res, next) => {
  console.log("📡 Notifications endpoint hit");
  next();
}, getNotifications);

// ✔ Mark single notification as read
router.put("/:id/read", protect, markAsRead);

export default router;