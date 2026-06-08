import { Router } from "express";
import { getNodeGraphController } from "../controllers/graph.controller";

const router = Router();

router.get(
  "/graph/:nodeId",
  getNodeGraphController
);

export default router;
