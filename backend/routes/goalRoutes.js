import { Router } from "express";
import {
  getActiveGoal,
  createOrUpdateGoal,
  updateGoalTargets,
  resetGoal
} from "../controllers/goalController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getActiveGoal);
router.post("/", requireAuth, createOrUpdateGoal);
router.put("/", requireAuth, updateGoalTargets);
router.delete("/", requireAuth, resetGoal);

export default router;
