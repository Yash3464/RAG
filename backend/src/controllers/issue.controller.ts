import {
  Request,
  Response
} from "express";

import {
  analyzeIssue
} from "../services/issue-resolution.service";

export const analyzeIssueController =
async (
  req: Request,
  res: Response
) => {

  try {

    const { issue } =
      req.body;

    const analysis =
      await analyzeIssue(
        issue
      );

    return res.json({
      success: true,
      analysis
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error
    });

  }

};