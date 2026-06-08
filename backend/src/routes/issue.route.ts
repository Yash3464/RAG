import { Router }
from "express";

import {
  analyzeIssueController
}
from "../controllers/issue.controller";

const router =
  Router();

router.post(
  "/issues/analyze",
  analyzeIssueController
);

export default router;