import { Router } from "express";
import {
  analyzeBody,
  analyzeFood,
  analyzeLifestyle,
  analyzeSkin,
  predictHealth,
  getHistory
} from "../controllers/analyzeController.js";
import { createHabit, listHabits } from "../controllers/habitController.js";
import { getAiInsights } from "../controllers/aiInsightsController.js";
import { getDailyFoodLog, addFoodLog, deleteFoodLog } from "../controllers/foodLogController.js";
import { handleAiChat } from "../controllers/chatController.js";
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
router.get("/food-logs",      requireAuth, getDailyFoodLog);
router.post("/food-logs",     requireAuth, addFoodLog);
router.delete("/food-logs/:id", requireAuth, deleteFoodLog);
router.post("/ai-chat",       requireAuth, handleAiChat);
router.get("/history",        requireAuth, getHistory);

export default router;
