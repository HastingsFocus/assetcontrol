import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Any logged-in user (HOD)
router.post("/create", protect, (req, res) => {
  res.json({ message: "Request created" });
});

export default router;