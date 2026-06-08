import {
  Request,
  Response
} from "express";

import {
  planReleases
} from "../services/release-planner.service";

export const releasePlanController =
async (
  req: Request,
  res: Response
) => {

  try {

    const releases =
      await planReleases();

    return res.json({
      success: true,
      ...releases
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error
    });

  }

};