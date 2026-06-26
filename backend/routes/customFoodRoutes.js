import { Router } from "express";
import {
  getCustomFoods,
  createCustomFood,
  updateCustomFood,
  deleteCustomFood
} from "../controllers/customFoodController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// All custom food endpoints require valid Supabase JWT session authentication
router.get("/", requireAuth, getCustomFoods);
router.post("/", requireAuth, createCustomFood);
router.put("/:id", requireAuth, updateCustomFood);
router.delete("/:id", requireAuth, deleteCustomFood);

export default router;
