import { Router } from "express";
import {
  getBacklogController,
} from "../controllers/backlog.controller";

const router = Router();

router.get(
  "/backlog",
  getBacklogController
);

export default router;