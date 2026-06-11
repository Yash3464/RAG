import { Request, Response } from "express";

import { JournalEntryModel } from "../models/JournalEntry";
import { ClassificationModel } from "../models/Classification";
import { RequirementReviewModel } from "../models/RequirementReview";
import { ConflictModel } from "../models/Conflict";
import { TaskModel } from "../models/Task";
import { AuditLogModel } from "../models/AuditLog";

import { classifyContent } from "../services/classification.service";
import { classifyPriority } from "../services/priority-classifier.service";
import { estimateEffort } from "../services/effort-estimation.service";
import { generateTask } from "../services/task-generator.service";

import { routeContent } from "../services/routing.service";
import { hybridSearch } from "../services/hybrid-search.service";
import { analyzeRequirement } from "../services/requirement-analyzer.service";
import { detectConflicts } from "../services/conflict-detection.service";

import { indexJournalEntry } from "../services/chunk-indexing.service";

import { createKnowledgeNode } from "../services/graph-builder.service";
import { findRelatedNodes } from "../services/relationship-detector.service";
import { detectEdges } from "../services/edge-detector.service";

import { checkDuplicateRequirement } from "../services/requirement-deduplication.service";

export const analyzeRequirementController = async (
  req: Request,
  res: Response
) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Requirement content is required"
      });
    }

    /**
     * STEP 1
     * Classification
     */
    const classification =
      await classifyContent(content);

    if (classification.type === "irrelevant") {
      const { generateCompletion } = require("../services/llm.service");
      const replyPrompt = `
You are BRAINED, an AI-powered Product Intelligence Platform.
The user entered: "${content}"
This is a general greeting or conversational input, not a software requirement or bug.
Reply politely, greet them, and explain that they should enter software requirements, bugs, issues, or change requests for analysis.
Keep it concise and friendly.
`;
      const reply = await generateCompletion(replyPrompt, 0.7);

      return res.status(200).json({
        success: true,
        irrelevant: true,
        reply
      });
    }

    /**
     * STEP 2
     * Duplicate Detection
     */
    const duplicate =
      await checkDuplicateRequirement(
        content
      );

    if (duplicate.duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        existing: duplicate.existing
      });
    }

    /**
     * STEP 3
     * Priority Classification
     */
    const priorityData =
      await classifyPriority(
        content,
        classification.type
      );

    /**
     * STEP 4
     * Effort Estimation
     */
    const effortData =
      await estimateEffort(
        content
      );

    /**
     * STEP 5
     * Create Journal Entry
     */
    const journalEntry =
      await JournalEntryModel.create({
        content,
        sourceType: "manual",

        classification:
          classification.type,

        status: "draft",

        priority:
          priorityData.priority,

        priorityScore:
          priorityData.totalScore,

        priorityReason:
          priorityData.reasoning,

        estimatedDevelopmentHours:
          effortData.developmentHours,

        estimatedTestingHours:
          effortData.testingHours,

        estimatedReviewHours:
          effortData.reviewHours,

        estimatedDocumentationHours:
          effortData.documentationHours,

        estimatedComputeHours:
          effortData.computeHours,

        complexityScore:
          effortData.complexity,

        versions: [
          {
            versionNumber: 1,
            content,
            title: content.substring(0, 100),
            modifiedBy: (req as any).user?.email || "admin@brained.ai"
          }
        ]
      });

    await AuditLogModel.create({
      action: "CREATE",
      targetId: journalEntry._id.toString(),
      targetType: classification.type,
      details: `Analyzed and created new ${classification.type}: "${content.substring(0, 120)}${content.length > 120 ? "..." : ""}"`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    /**
     * STEP 6
     * Auto Task Creation
     */
    if (
      classification.type === "bug" ||
      classification.type === "issue"
    ) {

      const task =
        await generateTask(
          content
        );

      await TaskModel.create({
        journalId:
          journalEntry._id,

        title:
          task.title,

        description:
          `
${task.description}

Acceptance Criteria:
${(
  task.acceptanceCriteria || []
).join("\n")}
          `,

        taskType:
          classification.type,

        aiGenerated:
          true,

        priority:
          task.priority ||
          priorityData.priority,

        priorityScore:
          priorityData.totalScore,

        estimatedHours:
          task.estimatedHours || 0
      });
    }

    /**
     * STEP 7
     * Chunk Indexing
     */
    await indexJournalEntry(
      journalEntry._id.toString(),
      content,
      {
        classification:
          classification.type,

        priority:
          priorityData.priority
      }
    );

    /**
     * STEP 8
     * Knowledge Graph Node
     */
    await createKnowledgeNode({
      nodeId:
        journalEntry._id.toString(),

      nodeType:
        classification.type,

      title:
        content.substring(0, 100),

      content,

      priority:
        priorityData.priority,

      domain: "",

      module: "",

      tags: []
    });

    /**
     * STEP 9
     * Relationship Detection
     */
    const relatedNodes =
      await findRelatedNodes(
        content
      );

    await detectEdges(
      {
        nodeId:
          journalEntry._id.toString(),

        content
      },
      relatedNodes
    );

    /**
     * STEP 10
     * Save Classification
     */
    await ClassificationModel.create({
      journalId:
        journalEntry._id,

      type:
        classification.type,

      confidence:
        classification.confidence
    });

    /**
     * STEP 11
     * Route Content
     */
    await routeContent(
      journalEntry._id.toString(),
      content,
      classification.type
    );

    const ideateTypes = [
      "requirement",
      "business_rule",
      "change_request",
      "decision"
    ];

    let analysis: any = null;

    let conflictResult = {
      conflicts: [],
      hasConflicts: false
    };

    let review: any = null;

    /**
     * STEP 12
     * Requirement Analysis
     */
    if (
      ideateTypes.includes(
        classification.type
      )
    ) {

      const context =
        await hybridSearch(
          content
        );

      analysis =
        await analyzeRequirement(
          content,
          context
        );

      conflictResult =
        detectConflicts(
          analysis
        );

      /**
       * STEP 13
       * Save Conflicts
       */
      if (
        conflictResult.hasConflicts
      ) {

        for (
          const conflict of
          conflictResult.conflicts as any[]
        ) {

          await ConflictModel.create({
            journalId:
              journalEntry._id,

            type:
              conflict.type ||
              "unknown",

            severity:
              conflict.severity ||
              "medium",

            description:
              conflict.description ||
              JSON.stringify(
                conflict
              )
          });
        }
      }

      /**
       * STEP 14
       * Create Review
       */
      review =
        await RequirementReviewModel.create({
          journalId:
            journalEntry._id,

          analysis,

          status:
            "pending"
        });
    }

    /**
     * RESPONSE
     */
    return res.status(200).json({
      success: true,

      duplicate: false,

      journalId:
        journalEntry._id,

      classification:
        classification.type,

      priority:
        priorityData.priority,

      priorityScore:
        priorityData.totalScore,

      effort: {
        development:
          effortData.developmentHours,

        testing:
          effortData.testingHours,

        review:
          effortData.reviewHours,

        documentation:
          effortData.documentationHours,

        compute:
          effortData.computeHours,

        complexity:
          effortData.complexity
      },

      reviewId:
        review?._id || null,

      conflicts:
        conflictResult.conflicts,

      analysis
    });

  } catch (error) {

    console.error(
      "CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Requirement analysis failed",
      error:
        error instanceof Error
          ? error.message
          : String(error)
    });
  }
};