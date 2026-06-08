import { Router }
from "express";

import {
  analyzeBugController
}
from "../controllers/bug.controller";

const router =
  Router();

router.post(
  "/bugs/analyze",
  analyzeBugController
);

export default router;