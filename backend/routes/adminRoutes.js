import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
const router = express.Router();

// 🔥 ONLY ADMIN CAN ACCESS
router.get("/dashboard", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin Dashboard" });
});

router.get("/all-requests", protect, adminOnly, (req, res) => {
  res.json({ message: "All requests visible to admin" });
});

export default router;