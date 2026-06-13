import { Router } from "express";

import {
  getReviewsController,
  getReviewController,
  approveReviewController,
  requestChangeController,
  refineReviewController
}
from "../controllers/review.controller";

const router =
  Router();

router.get(
  "/",
  getReviewsController
);

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