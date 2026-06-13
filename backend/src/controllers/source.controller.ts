import { Request, Response } from "express";
import { classifyContent } from "../services/classification.service";
import { classifyPriority } from "../services/priority-classifier.service";
import { estimateEffort } from "../services/effort-estimation.service";
import { parseContent } from "../services/file-parser.service";
import { DocumentModel } from "../models/Document";
import { ChunkModel } from "../models/Chunk";
import { chunkText } from "../services/chunking.service";
import { generateEmbedding } from "../services/embedding.service";
import { JournalEntryModel } from "../models/JournalEntry";
import { AuditLogModel } from "../models/AuditLog";

export const analyzeSourceController = async (
  req: Request,
  res: Response
) => {
  try {
    let rawContent = "";
    let sourceName = "";
    let sourceType: "pdf" | "email" | "meeting" = "meeting";

    // 1. Determine input (file upload vs URL vs raw body)
    if (req.file) {
      sourceName = req.file.originalname;
      const extension = sourceName.split(".").pop()?.toLowerCase();
      if (extension === "pdf") {
        sourceType = "pdf";
      } else if (extension === "eml" || sourceName.includes("email")) {
        sourceType = "email";
      } else {
        sourceType = "meeting";
      }
      // Parse file buffer
      rawContent = await parseContent(req.file.buffer, sourceName);
    } else if (req.body.url) {
      sourceName = req.body.url;
      sourceType = "meeting";
      // Scrape URL
      rawContent = await parseContent(req.body.url, sourceName);
    } else if (req.body.content) {
      // Raw content block or filename analysis
      sourceName = req.body.name || "Text Source";
      rawContent = req.body.content;
      if (sourceName.toLowerCase().includes("email")) {
        sourceType = "email";
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No content, file, or URL provided for analysis"
      });
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Extracted content is empty"
      });
    }

    // Check for duplicate document in db
    const existingDoc = await DocumentModel.findOne({ title: sourceName });
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: `A data source with the name "${sourceName}" has already been ingested in Project Memory.`
      });
    }

    // 2. Create Document entry for Project Memory
    const document = await DocumentModel.create({
      title: sourceName,
      sourceType,
      status: "active"
    });

    // 3. Chunk and Embed the parsed content
    const chunks = chunkText(rawContent);
    const chunkDocs = [];

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const embedding = await generateEmbedding(chunk);

      chunkDocs.push({
        documentId: document._id,
        chunkText: chunk,
        pageNumber: index + 1,
        embedding,
        metadata: {
          source: sourceName,
          uploadedAt: new Date()
        }
      });
    }

    if (chunkDocs.length > 0) {
      await ChunkModel.insertMany(chunkDocs);
    }

    // 4. Run AI Intelligence services on the content (using the first chunk or summary to prevent token overflows if very large)
    const analysisText = rawContent.length > 4000 ? rawContent.substring(0, 4000) : rawContent;
    const classification = await classifyContent(analysisText);
    const priority = await classifyPriority(analysisText, classification.type);
    const effort = await estimateEffort(analysisText);

    const validBacklogTypes = [
      "requirement",
      "business_rule",
      "task",
      "change_request",
      "approval",
      "decision",
      "assumption",
      "bug",
      "issue"
    ];

    // Exclude ingested sources from the backlog. They are saved strictly as document assets.
    await AuditLogModel.create({
      action: "CREATE",
      targetId: document._id.toString(),
      targetType: "document",
      details: `Ingested new knowledge source "${sourceName}" with classification "${classification.type}"`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      documentId: document._id,
      sourceType,
      name: sourceName,
      classification: classification.type,
      confidence: classification.confidence,
      priority: priority.priority,
      priorityScore: priority.totalScore,
      estimatedHours: effort.developmentHours + effort.testingHours,
      complexity: effort.complexity,
      chunksCreated: chunks.length,
      content: rawContent
    });
  } catch (error) {
    console.error("Source analysis controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Source analysis failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

import { TaskModel } from "../models/Task";
import { generateCompletion } from "../services/llm.service";

export const convertMeetingController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await DocumentModel.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const chunks = await ChunkModel.find({ documentId: id }).sort({ pageNumber: 1 });
    const fullContent = chunks.map(c => c.chunkText).join("\n\n");

    const prompt = `
You are a Lead Product Manager and Solution Architect.
Review the following Minutes of Meeting (MOM) / Transcripts and extract:
1. Product Requirements: New software requirements, modifications, or change requests.
2. Action Items: Technical or product tasks that need direct development.

MOM DOCUMENT CONTENT:
\${fullContent.substring(0, 8000)}

Format your response as a valid JSON object.

JSON SCHEMA:
{
  "requirements": [
    {
      "title": "Enable multi-vendor onboarding",
      "description": "System must support custom Stripe KYC checks for third-party sellers.",
      "priority": "critical|high|medium|low"
    }
  ],
  "tasks": [
    {
      "title": "Configure Stripe Webhook endpoint",
      "description": "Establish listener routes for identity verification updates from Connect onboarding.",
      "priority": "critical|high|medium|low",
      "estimatedHours": 10
    }
  ]
}

CRITICAL RULES:
- Return ONLY the raw JSON.
- DO NOT wrap in markdown \`\`\`json blocks.
- Generate high-fidelity and realistic requirements and tasks.
- If there are no clear items, extract general logical steps based on the topics discussed.
`;

    const result = await generateCompletion(prompt, 0.2);
    const cleanResult = result.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(cleanResult);
    let requirementsCreated = 0;
    let tasksCreated = 0;

    // 1. Process Extracted Requirements
    for (const reqItem of parsed.requirements || []) {
      const journalItem = await JournalEntryModel.create({
        content: reqItem.description || reqItem.title,
        sourceType: "meeting",
        classification: "requirement",
        status: "draft", // Starts in draft/under-review status for requirements
        priority: reqItem.priority || "medium",
        priorityScore: reqItem.priority === "critical" ? 85 : (reqItem.priority === "high" ? 65 : 45),
        complexityScore: 3,
        estimatedDevelopmentHours: 12,
        estimatedTestingHours: 4,
        versions: [
          {
            versionNumber: 1,
            content: reqItem.description || reqItem.title,
            title: reqItem.title,
            modifiedBy: (req as any).user?.email || "admin@brained.ai"
          }
        ]
      });
      requirementsCreated++;
    }

    // 2. Process Extracted Tasks
    for (const taskItem of parsed.tasks || []) {
      const journalItem = await JournalEntryModel.create({
        content: `[Task] \${taskItem.title}: \${taskItem.description}`,
        sourceType: "meeting",
        classification: "task",
        status: "approved", // Appears directly on release board as an engineering task
        priority: taskItem.priority || "medium",
        priorityScore: taskItem.priority === "critical" ? 85 : (taskItem.priority === "high" ? 65 : 45),
        complexityScore: 2,
        estimatedDevelopmentHours: taskItem.estimatedHours || 8,
        estimatedTestingHours: Math.ceil((taskItem.estimatedHours || 8) / 2),
        versions: [
          {
            versionNumber: 1,
            content: `[Task] \${taskItem.title}: \${taskItem.description}`,
            title: taskItem.title,
            modifiedBy: (req as any).user?.email || "admin@brained.ai"
          }
        ]
      });

      await TaskModel.create({
        journalId: journalItem._id,
        title: taskItem.title,
        description: taskItem.description,
        taskType: "task",
        priority: taskItem.priority || "medium",
        priorityScore: journalItem.priorityScore,
        status: "pending",
        estimatedHours: (taskItem.estimatedHours || 8) + Math.ceil((taskItem.estimatedHours || 8) / 2),
        aiGenerated: true,
        acceptanceCriteria: ["Completed in line with meeting objectives."]
      });
      tasksCreated++;
    }

    await AuditLogModel.create({
      action: "UPDATE",
      targetId: id,
      targetType: "document",
      details: `Converted MOM document "\${document.title}" into \${requirementsCreated} requirements and \${tasksCreated} tasks.`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      requirementsCreated,
      tasksCreated
    });

  } catch (error) {
    console.error("Failed to convert MOM meeting note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to convert MOM meeting note",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};