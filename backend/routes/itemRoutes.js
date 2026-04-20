import express from "express";

import {
  getItemTypes,
  setupInventory,
  getAllInventory,
  updateCondition,
  setupInventoryUpdate, // 🔥 ADD THIS CONTROLLER
} from "../controllers/itemController.js";

import protect from "../middleware/protect.js";
import adminOnly from "../middleware/adminOnly.js";
import Item from "../models/Item.js";

const router = express.Router();

// =======================
// CHECK IF INVENTORY SETUP EXISTS
// =======================
router.get("/check-setup", protect, async (req, res) => {
  try {
    const items = await Item.find();

    if (items.length > 0) {
      return res.json({ isSetup: true });
    }

    res.json({ isSetup: false });
  } catch (error) {
    console.error("❌ Setup check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// USER ROUTES
// =======================
router.get("/types", protect, getItemTypes);
router.post("/setup", protect, setupInventory);

// 🔥 NEW: EDIT INVENTORY SETUP (UPDATE EXISTING DATA)
router.put("/setup", protect, setupInventoryUpdate);

// =======================
// ADMIN ROUTES
// =======================
router.get("/all", protect, adminOnly, getAllInventory);
router.put("/:id", protect, adminOnly, updateCondition);

export default router;