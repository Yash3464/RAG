import { Request, Response } from "express";
import { analyzeBug } from "../services/bug-resolution.service";
import { EmployeeIssueModel } from "../models/EmployeeIssue";

export const analyzeBugController = async (req: Request, res: Response) => {
  try {
    const { bug } = req.body;
    const email = (req as any).user?.email || "unknown@brained.ai";

    const analysis = await analyzeBug(bug);

    // Save submission and AI analysis to database
    await EmployeeIssueModel.create({
      employeeEmail: email,
      type: "bug",
      content: bug,
      analysis,
    });

    return res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};