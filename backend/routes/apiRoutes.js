import { Router } from "express";
import {
  analyzeBody,
  analyzeFood,
  analyzeLifestyle,
  analyzeSkin,
  predictHealth,
} from "../controllers/analyzeController.js";
import { createHabit, listHabits } from "../controllers/habitController.js";
import { getAiInsights } from "../controllers/aiInsightsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// ── Protected routes (require valid Supabase JWT) ─────────────────────────────
router.post("/analyze-body",  requireAuth, analyzeBody);
router.post("/analyze-skin",  requireAuth, analyzeSkin);
router.post("/predict",       requireAuth, predictHealth);
router.post("/food",          requireAuth, analyzeFood);
router.post("/lifestyle",     requireAuth, analyzeLifestyle);
router.post("/ai-insights",   requireAuth, getAiInsights);
router.get("/habits",         requireAuth, listHabits);
router.post("/habits",        requireAuth, createHabit);

export default router;
