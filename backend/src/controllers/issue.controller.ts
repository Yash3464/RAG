import { Request, Response } from "express";
import { analyzeIssue } from "../services/issue-resolution.service";
import { EmployeeIssueModel } from "../models/EmployeeIssue";

export const analyzeIssueController = async (req: Request, res: Response) => {
  try {
    const { issue } = req.body;
    const email = (req as any).user?.email || "unknown@brained.ai";

    const analysis = await analyzeIssue(issue);

    // Save submission and AI analysis to database
    await EmployeeIssueModel.create({
      employeeEmail: email,
      type: "issue",
      content: issue,
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