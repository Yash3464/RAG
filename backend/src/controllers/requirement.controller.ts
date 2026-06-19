import { Request, Response } from "express";

import { JournalEntryModel } from "../models/JournalEntry";
import { ChatSessionModel } from "../models/ChatSession";
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
  console.log("[analyzeRequirementController] Started", {
    contentSnippet: req.body.content?.substring(0, 50),
    journalId: req.body.journalId,
    "req.socket.destroyed": req.socket?.destroyed,
    "res.writableEnded": res.writableEnded
  });
  try {
    const { content, journalId } = req.body;

    if (!content) {
      console.log("[analyzeRequirementController] Error: Content missing");
      return res.status(400).json({
        success: false,
        message: "Requirement content is required"
      });
    }

    /**
     * PHASE 1: READ-ONLY & LLM OPERATIONS (NO DB WRITES)
     * If these fail/time out, the database remains completely unchanged.
     */

    // 1. Duplicate Detection
    if (req.socket?.destroyed || res.writableEnded) {
      console.log("[analyzeRequirementController] Request socket destroyed or response ended before duplicate detection");
      return;
    }
    console.log("[analyzeRequirementController] Checking duplicate...");
    const duplicate = await checkDuplicateRequirement(content, journalId);
    console.log("[analyzeRequirementController] Duplicate check result:", duplicate.duplicate);

    if (duplicate.duplicate) {
      console.log("[analyzeRequirementController] Duplicate found, returning early");
      return res.status(200).json({
        success: true,
        duplicate: true,
        existing: (duplicate as any).existing
      });
    }

    // 2. Unified Requirement Analyzer LLM call
    if (req.socket?.destroyed || res.writableEnded) {
      console.log("[analyzeRequirementController] Request socket destroyed or response ended before LLM analyzer call");
      return;
    }
    console.log("[analyzeRequirementController] Calling LLM analyzer...");
    const { generateCompletion } = require("../services/llm.service");
    
    const prompt = `
You are BRAINED, an AI-powered Product Intelligence Platform.
Analyze the following user input and return a structured JSON response.

USER INPUT:
"${content}"

1. CLASSIFICATION:
Classify the text into one of these types:
- requirement
- business_rule
- task
- change_request
- approval
- decision
- assumption
- bug
- issue
- irrelevant (use this for general greetings like hi/hello, general chat, or content completely unrelated to software engineering/requirements)

2. PRIORITY EVALUATION (0-100 total score):
Score the following impact areas:
- businessImpact (0-25)
- complianceImpact (0-25)
- securityImpact (0-20)
- userImpact (0-20)
- dependencyImpact (0-10)
Provide reasoning as an array of strings.

3. COMPLEXITY (1-5 scale):
Estimate the development complexity:
1 = Very Simple (minor text change, simple logic)
2 = Simple (small UI component, minor API update)
3 = Medium (standard feature, CRUD operations)
4 = High (complex workflow, multiple integration points)
5 = Very High (major architectural change, high risk)

4. DETAILED ANALYSIS:
- If the classification is 'bug', 'issue', or 'task':
  Provide 'taskData' containing:
    - title: brief, clear task name
    - description: description of what needs to be fixed/done
    - acceptanceCriteria: array of strings
    - estimatedHours: suggested development hours (e.g. 4, 8, 16, 24)
- Else (for requirement, business_rule, change_request, decision):
  Provide 'analysis' containing:
    - refinedRequirement: a polished, clear, functional specification statement of the requirement
    - assumptions: array of strings of business/technical assumptions
    - dependencies: array of strings of systems/modules impacted or needed

Return ONLY valid JSON matching this schema (do not include backticks, markdown, or text outside the JSON):
{
  "classification": {
    "type": "requirement",
    "confidence": 95
  },
  "priority": {
    "businessImpact": 15,
    "complianceImpact": 10,
    "securityImpact": 5,
    "userImpact": 15,
    "dependencyImpact": 5,
    "reasoning": ["Reason 1", "Reason 2"]
  },
  "complexity": 3,
  "taskData": {
    "title": "...",
    "description": "...",
    "acceptanceCriteria": ["..."],
    "estimatedHours": 8
  },
  "analysis": {
    "refinedRequirement": "...",
    "assumptions": ["..."],
    "dependencies": ["..."]
  }
}
`;

    const resultText = await generateCompletion(prompt, 0.2);

    if (req.socket?.destroyed || res.writableEnded) return;

    let parsed: any;
    try {
      const cleanText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch (e) {
      try {
        const match = resultText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Could not parse JSON response");
        }
      } catch (innerError) {
        throw new Error("Failed to parse LLM analysis JSON response");
      }
    }

    const type = parsed.classification?.type || "requirement";
    const confidence = parsed.classification?.confidence || 95;

    // Handle irrelevant greeting early exit
    if (type === "irrelevant") {
      return res.status(200).json({
        success: true,
        irrelevant: true,
        reply: "Hi there! I am BRAINED, your AI Product Intelligence Assistant. Please enter a software requirement, bug, issue, or task description, and I'll analyze it for you!"
      });
    }

    const prio = parsed.priority || {};
    const priorityScore =
      (prio.businessImpact || 0) +
      (prio.complianceImpact || 0) +
      (prio.securityImpact || 0) +
      (prio.userImpact || 0) +
      (prio.dependencyImpact || 0);

    let priorityName: "low" | "medium" | "high" | "critical" = "medium";
    if (priorityScore >= 75) {
      priorityName = "critical";
    } else if (priorityScore >= 60) {
      priorityName = "high";
    } else if (priorityScore >= 40) {
      priorityName = "medium";
    } else {
      priorityName = "low";
    }

    const complexity = parsed.complexity || 3;

    // Standardize analysis structure
    let analysis: any = null;
    let conflictResult = {
      conflicts: [],
      hasConflicts: false
    };

    if (type === "bug" || type === "issue" || type === "task") {
      analysis = {
        refinedRequirement: content,
        assumptions: [],
        dependencies: [],
        taskData: {
          title: parsed.taskData?.title || `Refined ${type.toUpperCase()} Task`,
          description: parsed.taskData?.description || content,
          acceptanceCriteria: parsed.taskData?.acceptanceCriteria || [],
          priority: priorityName,
          priorityScore: priorityScore,
          estimatedHours: parsed.taskData?.estimatedHours || Math.ceil(complexity * 3)
        }
      };
    } else {
      analysis = {
        refinedRequirement: parsed.analysis?.refinedRequirement || content,
        assumptions: parsed.analysis?.assumptions || [],
        dependencies: parsed.analysis?.dependencies || [],
        taskData: null
      };
      
      // Perform conflict detection using resolved analysis
      const context = await hybridSearch(content);
      conflictResult = detectConflicts(analysis);
    }

    /**
     * PHASE 2: DATABASE PERSISTENCE (ALL SUCCESS)
     * We only modify the database now that all LLM calls have returned successfully!
     */
    if (req.socket?.destroyed || res.writableEnded) {
      console.warn("Client request aborted/timed out. Preventing database writes.");
      return;
    }

    // 1. Create or Update Journal Entry
    let journalEntry;
    if (journalId) {
      journalEntry = await JournalEntryModel.findById(journalId);
    }

    if (journalEntry) {
      journalEntry.content = content;
      journalEntry.classification = type;
      journalEntry.priority = priorityName;
      journalEntry.priorityScore = priorityScore;
      journalEntry.priorityReason = prio.reasoning || [];
      journalEntry.estimatedDevelopmentHours = Math.ceil(complexity * 3);
      journalEntry.estimatedTestingHours = Math.ceil(complexity * 1.5);
      journalEntry.estimatedReviewHours = Math.ceil(complexity / 2);
      journalEntry.estimatedDocumentationHours = Math.ceil(complexity / 2);
      journalEntry.estimatedComputeHours = complexity;
      journalEntry.complexityScore = complexity;

      const nextVersion = (journalEntry.versions || []).length + 1;
      journalEntry.versions.push({
        versionNumber: nextVersion,
        content,
        title: content.substring(0, 100),
        modifiedBy: (req as any).user?.email || "admin@brained.ai"
      });
      await journalEntry.save();
    } else {
      journalEntry = await JournalEntryModel.create({
        content,
        sourceType: "manual",
        classification: type,
        status: "draft",
        priority: priorityName,
        priorityScore: priorityScore,
        priorityReason: prio.reasoning || [],
        estimatedDevelopmentHours: Math.ceil(complexity * 3),
        estimatedTestingHours: Math.ceil(complexity * 1.5),
        estimatedReviewHours: Math.ceil(complexity / 2),
        estimatedDocumentationHours: Math.ceil(complexity / 2),
        estimatedComputeHours: complexity,
        complexityScore: complexity,
        versions: [
          {
            versionNumber: 1,
            content,
            title: content.substring(0, 100),
            modifiedBy: (req as any).user?.email || "admin@brained.ai"
          }
        ]
      });
    }

    // Clear old dependent data if this is an update to keep DB clean
    if (journalId) {
      await ConflictModel.deleteMany({ journalId: journalEntry._id });
      await ClassificationModel.deleteMany({ journalId: journalEntry._id });
      const { MeetingNoteModel } = require("../models/MeetingNote");
      const { DecisionModel } = require("../models/Decision");
      const { BusinessRuleModel } = require("../models/BusinessRule");
      const { ChangeRequestModel } = require("../models/ChangeRequest");
      await MeetingNoteModel.deleteMany({ journalId: journalEntry._id });
      await DecisionModel.deleteMany({ journalId: journalEntry._id });
      await BusinessRuleModel.deleteMany({ journalId: journalEntry._id });
      await ChangeRequestModel.deleteMany({ journalId: journalEntry._id });
    }

    // 2. Audit Log
    await AuditLogModel.create({
      action: journalId ? "UPDATE" : "CREATE",
      targetId: journalEntry._id.toString(),
      targetType: type,
      details: journalId
        ? `Re-analyzed and updated ${type}: "${content.substring(0, 120)}${content.length > 120 ? "..." : ""}"`
        : `Analyzed and created new ${type}: "${content.substring(0, 120)}${content.length > 120 ? "..." : ""}"`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    // 3. Chunk Indexing
    await indexJournalEntry(
      journalEntry._id.toString(),
      content,
      {
        classification: type,
        priority: priorityName
      }
    );

    // 4. Knowledge Graph Node
    await createKnowledgeNode({
      nodeId: journalEntry._id.toString(),
      nodeType: type,
      title: content.substring(0, 100),
      content,
      priority: priorityName,
      domain: "",
      module: "",
      tags: []
    });

    // 5. Relationship Edges
    const relatedNodes = await findRelatedNodes(content, journalEntry._id.toString());
    await detectEdges(
      {
        nodeId: journalEntry._id.toString(),
        content
      },
      relatedNodes
    );

    // 6. Save Classification
    await ClassificationModel.create({
      journalId: journalEntry._id,
      type,
      confidence
    });

    // 7. Route Content
    await routeContent(
      journalEntry._id.toString(),
      content,
      type
    );

    // 8. Save Conflicts (if standard type and has conflicts)
    if (conflictResult.hasConflicts) {
      for (const conflict of conflictResult.conflicts as any[]) {
        await ConflictModel.create({
          journalId: journalEntry._id,
          type: conflict.type || "unknown",
          severity: conflict.severity || "medium",
          description: conflict.description || JSON.stringify(conflict)
        });
      }
    }

    // 9. Save Review (generated for ALL types, including bug/issue/task)
    let review;
    if (journalId) {
      review = await RequirementReviewModel.findOne({ journalId: journalEntry._id });
    }

    if (review) {
      review.analysis = analysis;
      review.status = "pending";
      review.version += 1;
      review.reviewHistory.push({
        action: "re-analyzed",
        comments: "Re-analyzed updated specification content"
      });
      await review.save();
    } else {
      review = await RequirementReviewModel.create({
        journalId: journalEntry._id,
        analysis,
        status: "pending"
      });
    }

    /**
     * PHASE 3: RESPONSE
     */
    return res.status(200).json({
      success: true,
      duplicate: false,
      journalId: journalEntry._id,
      classification: type,
      priority: priorityName,
      priorityScore,
      effort: {
        development: Math.ceil(complexity * 3),
        testing: Math.ceil(complexity * 1.5),
        review: Math.ceil(complexity / 2),
        documentation: Math.ceil(complexity / 2),
        compute: complexity,
        complexity
      },
      reviewId: review?._id || null,
      conflicts: conflictResult.conflicts,
      analysis
    });

  } catch (error) {
    console.error("Failed to analyze requirement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze requirement",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const chatRequirementController = async (req: Request, res: Response) => {
  try {
    const { messages, requirement, journalId, sessionId, content } = req.body;
    const { generateCompletion } = require("../services/llm.service");

    // 1. Backwards compatibility fallback if frontend passes raw messages list directly
    if (messages && Array.isArray(messages)) {
      const systemPrompt = `You are BRAINED, an AI-powered Product Intelligence Platform.
You are helping the user (a Product Manager, Engineer, or Architect) refine, analyze, or answer questions about their requirement.

CURRENT REQUIREMENT SPECIFICATION:
"${requirement || "None entered yet."}"

Instructions:
- Provide highly technical, clear, and actionable feedback.
- Help them identify missing edge cases, business logic gaps, compliance rules, and architectural bottlenecks.
- Suggest concrete phrasing they can copy-paste back into their requirements edit window.
`;

      let prompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n`;
      for (const msg of messages) {
        const roleName = msg.role === "user" ? "User" : "AI Assistant";
        prompt += `${roleName}: ${msg.content}\n`;
      }
      prompt += `AI Assistant:`;

      const reply = await generateCompletion(prompt, 0.7);

      return res.json({
        success: true,
        reply: reply.trim(),
      });
    }

    // 2. New persistent ChatSession flow
    if (!journalId || !content) {
      return res.status(400).json({
        success: false,
        message: "Both journalId and message content are required for persistent chat refinement.",
      });
    }

    const journal = await JournalEntryModel.findById(journalId);
    if (!journal) {
      return res.status(404).json({
        success: false,
        message: "Linked requirement draft not found",
      });
    }

    let session;
    if (sessionId) {
      session = await ChatSessionModel.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }
    } else {
      // First message: create a new session
      const titleText = content.split(" ").slice(0, 5).join(" ") + (content.split(" ").length > 5 ? "..." : "");
      session = await ChatSessionModel.create({
        journalId,
        title: titleText || "New Refinement Chat",
        messages: [],
      });
    }

    // Push user message
    session.messages.push({
      role: "user",
      content,
      timestamp: new Date()
    });

    const systemPrompt = `You are BRAINED, an AI-powered Product Intelligence Platform.
You are helping the user refine, analyze, or answer questions about their draft requirement specification.

CURRENT DRAFT REQUIREMENT SPECIFICATION:
"${journal.content || "None entered yet."}"

Instructions:
- Provide highly technical, clear, and actionable feedback.
- Help them identify missing edge cases, business logic gaps, and architectural bottlenecks.
- Suggest concrete phrasing they can copy-paste to refine their specifications.
`;

    // Construct history prompt using messages stored in session
    let prompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n`;
    for (const msg of session.messages) {
      const roleName = msg.role === "user" ? "User" : "AI Assistant";
      prompt += `${roleName}: ${msg.content}\n`;
    }
    prompt += `AI Assistant:`;

    const reply = await generateCompletion(prompt, 0.7);

    // Push assistant reply
    session.messages.push({
      role: "assistant",
      content: reply.trim(),
      timestamp: new Date()
    });

    await session.save();

    return res.json({
      success: true,
      reply: reply.trim(),
      sessionId: session._id,
      session,
    });
  } catch (error) {
    console.error("Chat requirement controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Chat failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

import { RequirementMasterModel } from "../models/RequirementMaster";
import { KnowledgeNodeModel } from "../models/KnowledgeNode";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";
import { FRDModel } from "../models/FRD";

export const getRequirementsMasterController = async (req: Request, res: Response) => {
  try {
    const requirements = await RequirementMasterModel.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      requirements
    });
  } catch (error) {
    console.error("Failed to get requirement master list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved requirements"
    });
  }
};

export const deleteRequirementMasterController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await RequirementMasterModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Approved requirement not found"
      });
    }

    // Cascade delete knowledge nodes/edges and FRDs
    await KnowledgeNodeModel.deleteOne({ nodeId: deleted.requirementCode });
    await KnowledgeEdgeModel.deleteMany({
      $or: [
        { sourceNodeId: deleted.requirementCode },
        { targetNodeId: deleted.requirementCode }
      ]
    });
    
    // Also delete generated FRD
    await FRDModel.deleteOne({ requirementMasterId: id });

    // Log in audit log
    await AuditLogModel.create({
      action: "DELETE",
      targetId: id,
      targetType: "requirement_master",
      details: `Deleted approved requirement master entry: "${deleted.title}" (cascade deleted node context and FRDs)`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      message: "Approved requirement deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete approved requirement:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete approved requirement"
    });
  }
};

export const listRequirementChatsController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // journalId
    const sessions = await ChatSessionModel.find({ journalId: id }).sort({ updatedAt: -1 });
    return res.json({ success: true, sessions });
  } catch (error) {
    console.error("Failed to list chats:", error);
    return res.status(500).json({ success: false, message: "Failed to list chats" });
  }
};

export const getChatSessionController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }
    return res.json({ success: true, session });
  } catch (error) {
    console.error("Failed to fetch chat session:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat session" });
  }
};

export const updateRequirementDraftController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // journalId
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }
    const journal = await JournalEntryModel.findById(id);
    if (!journal) {
      return res.status(404).json({ success: false, message: "Requirement draft not found" });
    }
    journal.content = content;
    const nextVersion = (journal.versions || []).length + 1;
    journal.versions.push({
      versionNumber: nextVersion,
      content,
      title: "AI Refined Update",
      modifiedBy: (req as any).user?.email || "admin@brained.ai"
    });
    await journal.save();

    // Also update the KnowledgeNode content if the node exists!
    const { createKnowledgeNode } = require("../services/graph-builder.service");
    await createKnowledgeNode({
      nodeId: journal._id.toString(),
      nodeType: journal.classification,
      title: content.substring(0, 100),
      content,
      priority: journal.priority,
      domain: journal.domain,
      module: journal.module,
      tags: journal.tags
    });

    return res.json({ success: true, journal });
  } catch (error) {
    console.error("Failed to update requirement draft:", error);
    return res.status(500).json({ success: false, message: "Failed to update draft" });
  }
};