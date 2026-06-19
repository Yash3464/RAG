import { Request, Response } from "express";
import {RequirementReviewModel} from "../models/RequirementReview";
import {RequirementMasterModel} from "../models/RequirementMaster";
import {refineRequirement} from "../services/refinement.service";
import {publishToRequirementMaster} from "../services/requirement-master.service";
import {validateFeedback} from "../services/feedback-validation.service";
import {propagateChanges} from "../services/change-propagation.service";
import {createDependencyMap} from "../services/dependency-mapper.service";
import {generateImpactAnalysis} from "../services/impact-analysis.service";
import { JournalEntryModel } from "../models/JournalEntry";
import { TaskModel } from "../models/Task";


export const getReviewsController = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) {
      query.status = status;
    }
    const reviews = await RequirementReviewModel.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    });
  }
};

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

import {generateFRD} from "../services/frd-generator.service";
import {breakdownFRDTasks} from "../services/task-breakdown.service";

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

    // Load the linked JournalEntry to verify classification type
    const journal = await JournalEntryModel.findById(review.journalId);
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Linked requirement draft context not found"
      });
    }

    // Summarize the requirement text into a concise backlog card description
    if (journal.classification === "requirement") {
      const { generateCompletion } = require("../services/llm.service");
      const summaryPrompt = `You are a professional Product Manager. Summarize the following software requirement draft specification into a concise, clear description (1-2 sentences) suitable for a backlog item card. Do not add intro/outro, return only the summary.
      
DRAFT SPECIFICATION:
"${journal.content}"

Response:`;
      try {
        const summary = await generateCompletion(summaryPrompt, 0.3);
        if (summary && summary.trim()) {
          journal.content = summary.trim();
        }
      } catch (err) {
        console.error("Failed to generate summary for finalized backlog item:", err);
        journal.content = journal.content.split("\n")[0].substring(0, 150) + "...";
      }
    }

    journal.status = "approved";
    await journal.save();

    // If it is a Bug, Issue, or Task, create the single backlog task directly
    if (journal.classification === "bug" || journal.classification === "issue" || journal.classification === "task") {
      const taskData = (review.analysis as any).taskData || {};
      const task = await TaskModel.create({
        journalId: review.journalId,
        title: taskData.title || `Refined ${journal.classification.toUpperCase()} Task`,
        description: `
${taskData.description || ""}

Acceptance Criteria:
${(taskData.acceptanceCriteria || []).join("\n")}
        `,
        taskType: journal.classification,
        aiGenerated: true,
        priority: taskData.priority || "medium",
        priorityScore: taskData.priorityScore || 0,
        estimatedHours: taskData.estimatedHours || 0
      });

      return res.status(200).json({
        success: true,
        review,
        task
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

    /*
    Generate FRD (Functional Requirement Document)
    */
    const frd = await generateFRD(masterRecord._id.toString());

    /*
    Generate Task Breakdown
    */
    const tasks = await breakdownFRDTasks(frd._id.toString());

    return res.status(200).json({
      success: true,
      review,
      masterRecord,
      dependencyMap,
      impactAnalysis,
      frd,
      tasks
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