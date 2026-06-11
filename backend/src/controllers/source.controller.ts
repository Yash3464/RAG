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