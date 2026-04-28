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
import { requireSetup } from "../middleware/setupMiddleware.js";

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
router.post("/setup", protect, setupInventory);

// =======================
// 🔐 USER INVENTORY (SETUP REQUIRED)
// =======================

// Get my inventory
router.get("/my-inventory", protect, requireSetup, getMyInventory);

// 🔥 CREATE NEW ITEM (MISSING BEFORE — THIS FIXES YOUR 404)
router.post("/my-item", protect, requireSetup, createMyItem);

// Update item
router.put("/my-item/:id", protect, requireSetup, updateMyItem);

// Delete item
router.delete("/my-item/:id", protect, requireSetup, deleteMyItem);

// =======================
// 🔥 ADMIN ROUTES
// =======================

// Get all inventory
router.get("/all", protect, adminOnly, getAllInventory);

// Update condition (admin stock control)
router.put("/:id", protect, adminOnly, updateCondition);

export default router;