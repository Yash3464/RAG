import { Router } from "express";
import {
  analyzeRequirementController,
  chatRequirementController
} from "../controllers/requirement.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/requirements/analyze",
  authMiddleware,
  analyzeRequirementController
);

router.post(
  "/requirements/chat",
  authMiddleware,
  chatRequirementController
);

export default router;