import { Router } from "express";

import {
  searchChunks
} from "../controllers/search.controller";

const router = Router();

router.post(
  "/search",
  searchChunks
);

export default router;
