import { Router }
from "express";

import {
  analyzeRequirementController
}
from "../controllers/requirement.controller";

const router = Router();

router.post(
  "/requirements/analyze",
  analyzeRequirementController
);

export default router;