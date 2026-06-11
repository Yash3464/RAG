import { Router } from "express";
import { loginController } from "../controllers/auth.controller";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware";
import { AuditLogModel } from "../models/AuditLog";

const router = Router();

router.post("/auth/login", loginController);

router.get("/audit-logs", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const logs = await AuditLogModel.find({}).sort({ createdAt: -1 });
    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
