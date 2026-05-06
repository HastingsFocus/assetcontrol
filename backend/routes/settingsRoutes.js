import express from "express";
import { completeSetup } from "../controllers/settingsController.js";
import protect from "../middleware/authMiddleware.js"; // ⚠️ IMPORTANT

const router = express.Router();

// 🔥 PROTECTED ROUTE
router.put("/setup-complete", protect, completeSetup);

export default router;