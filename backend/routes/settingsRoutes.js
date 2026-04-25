import express from "express";
import { checkSetup, completeSetup } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/check-setup", checkSetup);
router.put("/setup-complete", completeSetup);

export default router;