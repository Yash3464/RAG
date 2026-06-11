import { Router } from "express";
import { getNodeGraphController } from "../controllers/graph.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/graph/:nodeId",
  authMiddleware,
  getNodeGraphController
);

export default router;
