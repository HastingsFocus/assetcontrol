import express from "express";

import {
  getItemTypes,
  setupInventory,
  getAllInventory,
  updateCondition
} from "../controllers/itemController.js";

import protect from "../middleware/protect.js";
import adminOnly from "../middleware/adminOnly.js";

const router = express.Router();

// user
router.get("/types", protect, getItemTypes);
router.post("/setup", protect, setupInventory);

// admin
router.get("/all", protect, adminOnly, getAllInventory);
router.put("/:id", protect, adminOnly, updateCondition);

export default router;