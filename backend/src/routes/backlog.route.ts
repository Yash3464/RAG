import { Router } from "express";
import {
  getBacklogController,
  updateBacklogItemStatusController,
  deleteBacklogItemController,
  updateBacklogItemController,
  getBacklogItemByIdController,
  rollbackBacklogItemVersionController
} from "../controllers/backlog.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/backlog",
  authMiddleware,
  getBacklogController
);

router.get(
  "/backlog/:id",
  authMiddleware,
  getBacklogItemByIdController
);

router.post(
  "/backlog/:id/rollback",
  authMiddleware,
  rollbackBacklogItemVersionController
);

router.put(
  "/backlog/:id/status",
  authMiddleware,
  updateBacklogItemStatusController
);

router.put(
  "/backlog/:id",
  authMiddleware,
  updateBacklogItemController
);

router.delete(
  "/backlog/:id",
  authMiddleware,
  requireAdmin,
  deleteBacklogItemController
);

export default router;