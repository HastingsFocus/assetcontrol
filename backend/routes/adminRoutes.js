import express from "express";
import protect from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

import {
  getAllUsers,
  deleteUser,
  getSystemStats,
} from "../controllers/adminController.js";

import {
  getAllLogs,
  getLogsByAction,
  getUserLogs,
} from "../controllers/logController.js";

const router = express.Router();

/* =========================
   🔐 ADMIN + SUPER ADMIN
========================= */

router.get(
  "/dashboard",
  protect,
  roleMiddleware("admin", "super_admin"),
  (req, res) => {
    res.json({ message: "Admin Dashboard" });
  }
);

router.get(
  "/all-requests",
  protect,
  roleMiddleware("admin", "super_admin"),
  (req, res) => {
    res.json({ message: "Requests visible" });
  }
);

/* =========================
   👑 SUPER ADMIN ONLY
========================= */

router.get(
  "/users",
  protect,
  roleMiddleware("super_admin"),
  getAllUsers
);

router.delete(
  "/users/:id",
  protect,
  roleMiddleware("super_admin"),
  deleteUser
);

router.get(
  "/stats",
  protect,
  roleMiddleware("super_admin"),
  getSystemStats
);

/* =========================
   📜 AUDIT LOGS
========================= */

router.get(
  "/logs",
  protect,
  roleMiddleware("super_admin"),
  getAllLogs
);

router.get(
  "/logs/action/:action",
  protect,
  roleMiddleware("super_admin"),
  getLogsByAction
);

router.get(
  "/logs/user/:id",
  protect,
  roleMiddleware("super_admin"),
  getUserLogs
);

export default router;