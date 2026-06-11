import { Router } from "express";
import { analyzeBugController } from "../controllers/bug.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/bugs/analyze",
  authMiddleware,
  analyzeBugController
);

export default router;