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

const router = Router();

router.post("/analyze-body", analyzeBody);
router.post("/analyze-skin", analyzeSkin);
router.post("/predict", predictHealth);
router.get("/habits", listHabits);
router.post("/habits", createHabit);
router.post("/food", analyzeFood);
router.post("/lifestyle", analyzeLifestyle);
router.post("/ai-insights", getAiInsights);

export default router;
