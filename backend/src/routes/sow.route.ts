import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getSOWsController,
  getSOWHistoryController,
  uploadSOWController,
  mergeSOWUpdateController,
  deleteSOWController,
} from "../controllers/sow.controller";

const router = Router();

router.get("/", authMiddleware, getSOWsController);
router.get("/:id", authMiddleware, getSOWHistoryController);
router.post("/upload", authMiddleware, upload.single("file"), uploadSOWController);
router.post("/:updateId/merge", authMiddleware, mergeSOWUpdateController);
router.delete("/:id", authMiddleware, deleteSOWController);

export default router;
