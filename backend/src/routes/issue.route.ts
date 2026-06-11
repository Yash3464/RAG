import { Router } from "express";
import { analyzeIssueController } from "../controllers/issue.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/issues/analyze",
  authMiddleware,
  analyzeIssueController
);

export default router;