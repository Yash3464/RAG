import { Request, Response } from "express";
import { generateImpactAnalysis }
from "../services/impact-analysis.service";

export const analyzeImpactController =
async (
  req: Request,
  res: Response
) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    const impact =
      await generateImpactAnalysis(
        content
      );

    return res.json({
      success: true,
      impact
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Impact analysis failed"
    });
  }
};