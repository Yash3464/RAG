import { Router } from "express";

import {
  chatWithDocument
} from "../controllers/chat.controller";

const router = Router();

router.post(
  "/chat",
  chatWithDocument
);

export default router;
