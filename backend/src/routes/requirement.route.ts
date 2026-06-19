import { Router } from "express";
import {
  analyzeRequirementController,
  chatRequirementController,
  getRequirementsMasterController,
  deleteRequirementMasterController,
  listRequirementChatsController,
  getChatSessionController,
  updateRequirementDraftController
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

router.get(
  "/requirements/:id/chats",
  authMiddleware,
  listRequirementChatsController
);

router.get(
  "/chats/:sessionId",
  authMiddleware,
  getChatSessionController
);

router.patch(
  "/requirements/:id",
  authMiddleware,
  updateRequirementDraftController
);

router.get(
  "/requirements-master",
  authMiddleware,
  getRequirementsMasterController
);

router.delete(
  "/requirements-master/:id",
  authMiddleware,
  requireAdmin,
  deleteRequirementMasterController
);

export default router;