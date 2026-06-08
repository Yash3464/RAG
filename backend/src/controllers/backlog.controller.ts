import { Request, Response } from "express";
import { planReleases } from "../services/release-planner.service";

export const getBacklogController = async (
  req: Request,
  res: Response
) => {
  try {
    const planned = await planReleases();

    return res.json({
      success: true,
      summary: {
        total: planned.release1.length + planned.release2.length + planned.release3.length,
        release1: planned.release1.length,
        release2: planned.release2.length,
        release3: planned.release3.length,
      },
      release1: planned.release1,
      release2: planned.release2,
      release3: planned.release3,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};