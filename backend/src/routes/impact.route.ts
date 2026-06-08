import { Router } from "express";
import {
  analyzeImpactController
} from "../controllers/impact.controller";

console.log(
  "Impact Routes Loaded"
);

const router = Router();

router.post(
  "/analyze",
  analyzeImpactController
);

export default router;