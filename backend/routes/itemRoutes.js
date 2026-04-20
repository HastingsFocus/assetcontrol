import express from "express";

import {
  getItemTypes,
  setupInventory,
  getAllInventory,
  updateCondition,
  getMyInventory,
  updateMyItem,
  deleteMyItem,
} from "../controllers/itemController.js";

import protect from "../middleware/protect.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

// =======================
// USER ROUTES
// =======================
router.get("/types", protect, getItemTypes);

// CREATE + UPDATE INVENTORY (SETUP MODE)
router.post("/setup", protect, setupInventory);

// GET MY INVENTORY
router.get("/my-inventory", protect, getMyInventory);

// 🔥 UPDATE SINGLE ITEM (USER EDIT MODE)
router.put("/my-item/:id", protect, updateMyItem);

router.delete("/my-item/:id", protect, deleteMyItem);

// =======================
// ADMIN ROUTES
// =======================
router.get("/all", protect, adminOnly, getAllInventory);
router.put("/:id", protect, adminOnly, updateCondition);

export default router;
