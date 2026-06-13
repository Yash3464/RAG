import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  analyzeSourceController,
  convertMeetingController
} from "../controllers/source.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/analyze",
  authMiddleware,
  upload.single("file"),
  analyzeSourceController
);

router.post(
  "/:id/convert-meeting",
  authMiddleware,
  convertMeetingController
);

export default router;