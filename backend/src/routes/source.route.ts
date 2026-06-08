import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import {
  analyzeSourceController
} from "../controllers/source.controller";

const router = Router();

router.post(
  "/analyze",
  upload.single("file"),
  analyzeSourceController
);

export default router;