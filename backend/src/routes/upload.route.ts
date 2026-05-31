import { Router } from "express";
import { ChunkModel } from "../models/Chunk";
import { upload } from "../middleware/upload.middleware";

import {
  uploadDocument
} from "../controllers/upload.controller";


const router = Router();

router.get("/chunks", async (req, res) => {
  try {
    const chunks = await ChunkModel.find().limit(20);

    res.json({
      success: true,
      totalChunks: chunks.length,
      chunks
    });
  } catch (error) {
    res.status(500).json({
      success: false
    });
  }
});

router.post(
  "/upload",
  (req, res, next) => {
    console.log("UPLOAD ROUTE HIT");
    next();
  },
  upload.single("file"),
  uploadDocument
);

export default router;
