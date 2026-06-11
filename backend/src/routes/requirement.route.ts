import { Router } from "express";
import {
  analyzeRequirementController
} from "../controllers/requirement.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/requirements/analyze",
  authMiddleware,
  analyzeRequirementController
);

export default router;