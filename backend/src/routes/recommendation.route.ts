import { Router } from "express";
import { getRecommendationsController } from "../controllers/recommendation.controller";

const router = Router();

router.post(
  "/requirements/recommendations",
  getRecommendationsController
);

export default router;
