import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  analyzeSourceController
} from "../controllers/source.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/analyze",
  authMiddleware,
  upload.single("file"),
  analyzeSourceController
);

export default router;