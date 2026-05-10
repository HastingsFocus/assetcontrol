import express from "express";
import {
  createEditRequest,
  getMyEditAccess,
  completeEditAccess,
  getAllEditRequests,
  decideEditRequest,
} from "../controllers/editRequestController.js";

import protect, { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================
// 🔐 USER (HOD) ROUTES
// =========================
router.post("/", protect, createEditRequest);
router.get("/my", protect, getMyEditAccess);
router.post("/done", protect, completeEditAccess);

// =========================
// 🛡️ ADMIN ROUTES
// =========================
router.get("/", protect, adminOnly, getAllEditRequests);
router.put("/:id", protect, adminOnly, decideEditRequest);

export default router;
