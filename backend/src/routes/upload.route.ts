import { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { uploadDocument } from "../controllers/upload.controller";

const router = Router();

router.post("/upload", upload.single("file"), uploadDocument);

export default router;
