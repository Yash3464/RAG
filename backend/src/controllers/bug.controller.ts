import {
  Request,
  Response
} from "express";

import {
  analyzeBug
} from "../services/bug-resolution.service";

export const analyzeBugController =
async (
  req: Request,
  res: Response
) => {

  try {

    const { bug } =
      req.body;

    const analysis =
      await analyzeBug(
        bug
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