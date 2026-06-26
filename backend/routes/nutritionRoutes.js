import { Router } from "express";
import { searchNutrition } from "../controllers/nutritionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/nutrition/search (Protected by Supabase JWT Auth)
router.post("/search", requireAuth, searchNutrition);

export default router;
