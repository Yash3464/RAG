import { Request, Response } from "express";
import {RequirementReviewModel} from "../models/RequirementReview";
import {RequirementMasterModel} from "../models/RequirementMaster";
import {refineRequirement} from "../services/refinement.service";
import {publishToRequirementMaster} from "../services/requirement-master.service";
import {validateFeedback} from "../services/feedback-validation.service";
import {propagateChanges} from "../services/change-propagation.service";
import {createDependencyMap} from "../services/dependency-mapper.service";
import {generateImpactAnalysis} from "../services/impact-analysis.service";


/*
========================================
GET REVIEW
========================================
*/

export const getReviewController =
async (
  req: Request,
  res: Response
) => {
  try {

    const review =
      await RequirementReviewModel.findById(
        req.params.id
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    return res.status(200).json({
      success: true,
      review
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch review"
    });
  }
};

/*
========================================
APPROVE REVIEW
========================================
*/

export const approveReviewController =
async (
  req: Request,
  res: Response
) => {

  try {

    const review =
      await RequirementReviewModel.findByIdAndUpdate(
        req.params.id,
        {
          status: "approved",
          $push: {
            reviewHistory: {
              action: "approved"
            }
          }
        },
        {
          new: true
        }
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    /*
    Publish Requirement Master
    */

    const masterRecord =
      await publishToRequirementMaster(
        review._id.toString()
      );

    /*
    Generate Dependency Map
    */

    const dependencyMap =
      await createDependencyMap(
        masterRecord._id.toString()
      );

    /*
    Generate Impact Analysis
    */

    const impactAnalysis =
      await generateImpactAnalysis(
        (masterRecord as any).refinedRequirement
      );

    return res.status(200).json({
      success: true,
      review,
      masterRecord,
      dependencyMap,
      impactAnalysis
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve review"
    });
  }
};

/*
========================================
REQUEST CHANGES
========================================
*/

export const requestChangeController =
async (
  req: Request,
  res: Response
) => {

  try {

    const { comments } =
      req.body;

    const review =
      await RequirementReviewModel.findByIdAndUpdate(
        req.params.id,
        {
          status:
            "change_requested",

          userComments:
            comments,

          $push: {
            reviewHistory: {
              action:
                "change_requested",
              comments
            }
          }
        },
        {
          new: true
        }
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    return res.status(200).json({
      success: true,
      review
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to request changes"
    });
  }
};

/*
========================================
REFINE REVIEW
========================================
*/

export const refineReviewController =
async (
  req: Request,
  res: Response
) => {

  try {

    const { comments } =
      req.body;

    const review =
      await RequirementReviewModel.findById(
        req.params.id
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    /*
    Validate Feedback
    */

    const validation =
      await validateFeedback(
        review.analysis.refinedRequirement,
        comments
      );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message:
          validation.reason
      });
    }

    /*
    Refine Requirement
    */

    const refinedAnalysis =
      await refineRequirement(
        review.analysis.refinedRequirement,
        comments
      );

    review.analysis =
      refinedAnalysis;

    review.version += 1;

    review.status =
      "pending";

    review.userComments =
      comments;

    review.reviewHistory.push({
      action: "refined",
      comments
    } as any);

    await review.save();

    /*
    Change Propagation
    */

    const master =
      await RequirementMasterModel.findOne({
        sourceReviewId:
          review._id
      });

    let impacts: any[] = [];

    if (master) {

      impacts =
        await propagateChanges(
          master._id.toString()
        );
    }

    return res.status(200).json({
      success: true,
      review,
      impacts
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to refine review"
    });
  }
};