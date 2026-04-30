import express from "express";
import { completeSetup } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/setup-complete", protect, completeSetup);

export default router;