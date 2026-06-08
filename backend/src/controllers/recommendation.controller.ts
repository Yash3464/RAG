import { Request, Response } from "express";
import { generateRecommendations } from "../services/recommendation.service";

export const getRecommendationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Requirement content is required to generate recommendations"
      });
    }

    const recommendations = await generateRecommendations(content);

    return res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error("Recommendations controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
