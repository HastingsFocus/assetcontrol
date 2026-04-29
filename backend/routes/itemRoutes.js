import express from "express";

import {
  getItemTypes,
  setupInventory,
  getAllInventory,
  updateCondition,
  getMyInventory,
  updateMyItem,
  deleteMyItem,
  checkSetup,
  createMyItem,
} from "../controllers/itemController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
// ❌ remove requireSetup from here (not needed for inventory flow)
// import { requireSetup } from "../middleware/setupMiddleware.js";

const router = express.Router();

// =======================
// 🔐 USER ROUTES
// =======================

// Get item types
router.get("/types", protect, getItemTypes);

// Check setup status
router.get("/check-my-setup", protect, checkSetup);

// =======================
// 🔥 INVENTORY SETUP
// =======================

// Initial setup (allowed before setup is complete)
router.post("/setup", protect, setupInventory);

// =======================
// 🔐 USER INVENTORY (FIXED)
// =======================

// ✅ DO NOT BLOCK WITH requireSetup

router.get("/my-inventory", protect, getMyInventory);

router.post("/my-item", protect, createMyItem);

router.put("/my-item/:id", protect, updateMyItem);

router.delete("/my-item/:id", protect, deleteMyItem);

// =======================
// 🔥 ADMIN ROUTES
// =======================

router.get("/all", protect, adminOnly, getAllInventory);

router.put("/:id", protect, adminOnly, updateCondition);

export default router;