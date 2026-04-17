import express from "express";
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} from "../controllers/requestController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// HOD creates request
router.post("/", protect, createRequest);

// HOD gets own requests
router.get("/my", protect, getMyRequests);

// ADMIN gets all requests
router.get("/", protect, adminOnly, getAllRequests);

// ADMIN approves/rejects
router.put("/:id", protect, adminOnly, updateRequestStatus);

export default router;