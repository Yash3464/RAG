import { Router } from "express";

import {
  getReviewController,
  approveReviewController,
  requestChangeController,
  refineReviewController
}
from "../controllers/review.controller";

const router =
  Router();

router.get(
  "/:id",
  getReviewController
);

router.post(
  "/:id/approve",
  approveReviewController
);

router.post(
  "/:id/refine",
  refineReviewController
);

router.post(
  "/:id/request-change",
  requestChangeController
);

export default router;