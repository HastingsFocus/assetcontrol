import express from "express";

import {
  getItemTypes,
  setupInventory,
  getAllInventory,
  updateCondition,
  getMyInventory,
  updateMyItem,
  deleteMyItem,
  checkSetup, // ✅ ADD THIS
} from "../controllers/itemController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { requireSetup } from "../middleware/setupMiddleware.js";

const router = express.Router();

// =======================
// 🔐 USER ROUTES
// =======================

// Get item types (requires login only)
router.get("/types", protect, getItemTypes);

// =======================
// 🔥 CHECK SETUP (VERY IMPORTANT)
// =======================
router.get(
  "/check-my-setup",   
  protect,
  checkSetup
);

// =======================
// 🔥 INVENTORY SETUP ROUTE (NO setup check here)
// =======================
router.post("/setup", protect, setupInventory);

// =======================
// 🔐 PROTECTED INVENTORY ROUTES (MUST HAVE SETUP)
// =======================

// Get my inventory
router.get(
  "/my-inventory",
  protect,
  requireSetup,
  getMyInventory
);

// Update item
router.put(
  "/my-item/:id",
  protect,
  requireSetup,
  updateMyItem
);

// Delete item
router.delete(
  "/my-item/:id",
  protect,
  requireSetup,
  deleteMyItem
);

// =======================
// 🔥 ADMIN ROUTES
// =======================

// Get all inventory (admin/hod)
router.get(
  "/all",
  protect,
  adminOnly,
  getAllInventory
);

// Admin update condition
router.put(
  "/:id",
  protect,
  adminOnly,
  updateCondition
);

export default router;