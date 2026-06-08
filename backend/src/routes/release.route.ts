import { Router }
from "express";

import {
  releasePlanController
} from "../controllers/release.controller";

const router =
  Router();

router.get(
  "/releases/plan",
  releasePlanController
);

export default router;