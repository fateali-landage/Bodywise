import { Router } from "express";
import {
  getWeightHistory,
  addWeightLog,
  deleteWeightLog
} from "../controllers/weightController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getWeightHistory);
router.post("/", requireAuth, addWeightLog);
router.delete("/:id", requireAuth, deleteWeightLog);

export default router;
