import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";
const router = express.Router();

// ======================
// AUTH ROUTES
// ======================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect,logoutUser );

// 🔐 Protected route
router.get("/me", protect, getMe);

export default router;