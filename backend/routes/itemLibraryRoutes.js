import express from "express";
import {
  getReusableItems,
  trackItemUsage,
  approveLibraryItem,
} from "../controllers/itemLibraryController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET reusable items
router.get("/my-library", authMiddleware, getReusableItems);

// track usage (call from requisition OR item creation)
router.post("/track", authMiddleware, trackItemUsage);

// admin approval
router.put("/approve/:id", authMiddleware, approveLibraryItem);

export default router;