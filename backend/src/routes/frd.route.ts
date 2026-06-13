import { Router } from "express";
import { FRDModel } from "../models/FRD";
import { TaskModel } from "../models/Task";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/frd/:requirementMasterId", authMiddleware, async (req, res) => {
  try {
    const { requirementMasterId } = req.params;
    const frd = await FRDModel.findOne({ requirementMasterId });
    
    if (!frd) {
      return res.status(404).json({
        success: false,
        message: "FRD not found for the given requirement master record"
      });
    }

    const tasks = await TaskModel.find({ sourceId: requirementMasterId });

    return res.json({
      success: true,
      frd,
      tasks
    });
  } catch (error) {
    console.error("Failed to fetch FRD:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FRD details"
    });
  }
});

export default router;
