import { Router } from "express";

import {
  askQuestion
} from "../controllers/ask.controller";

const router = Router();

router.post(
  "/ask",
  askQuestion
);

export default router;
