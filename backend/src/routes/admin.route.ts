import { Router } from "express";
import { authMiddleware, requireAdmin, AuthenticatedRequest } from "../middleware/auth.middleware";
import { EmployeeStatusModel } from "../models/EmployeeStatus";
import { EmployeeIssueModel } from "../models/EmployeeIssue";
import { DocumentModel } from "../models/Document";
import { ChunkModel } from "../models/Chunk";
import { AuditLogModel } from "../models/AuditLog";
import { generateCompletion } from "../services/llm.service";

const router = Router();

// 1. Update status of the logged-in employee (Requires Auth)
router.post("/employees/status", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, isWorking, currentTask, secondsElapsed } = req.body;
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email missing from auth token",
      });
    }

    const updated = await EmployeeStatusModel.findOneAndUpdate(
      { email },
      {
        status,
        isWorking,
        currentTask: currentTask || "",
        secondsElapsed: secondsElapsed || 0,
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update employee status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 2. Fetch status of all employees (Admin Only)
router.get("/admin/employees/status", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const statuses = await EmployeeStatusModel.find({}).sort({ lastUpdated: -1 });
    return res.json({
      success: true,
      statuses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee statuses",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 3. Fetch all ingested documents (Admin Only)
router.get("/admin/documents", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const documents = await DocumentModel.find({}).sort({ createdAt: -1 });
    return res.json({
      success: true,
      documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 4. Retrieve/Generate document AI summary & full text (Admin Only)
router.get("/admin/documents/:id/summary", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DocumentModel.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if summary and text are already cached
    if (doc.summary && doc.fullText) {
      return res.json({
        success: true,
        summary: doc.summary,
        fullText: doc.fullText,
      });
    }

    // Fetch chunks and join them to reconstruct raw document text
    const chunks = await ChunkModel.find({ documentId: id }).sort({ pageNumber: 1 });
    const fullText = chunks.map(c => c.chunkText).join("\n\n");

    if (!fullText) {
      return res.status(404).json({
        success: false,
        message: "No parsed text content found for this document",
      });
    }

    // Generate summary via LLM
    const prompt = `Provide a concise executive summary of the following document content in 3-4 clear bullet points. Highlight key objectives, decisions, constraints, or business requirements. Return ONLY the bullet points (starting with "- ") with no introduction, conclusion, formatting wrappers, or markdown code blocks:\n\nCONTENT:\n${fullText.substring(0, 8000)}`;
    const summary = await generateCompletion(prompt, 0.2);

    // Cache results in DocumentModel
    doc.fullText = fullText;
    doc.summary = summary.trim();
    await doc.save();

    return res.json({
      success: true,
      summary: doc.summary,
      fullText: doc.fullText,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve or generate document summary",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 5. Search for keyword in chunk content and return matching documents (Admin Only)
router.get("/admin/documents/search", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query parameter 'q' is required",
      });
    }

    // Search matching chunks
    const chunks = await ChunkModel.find({
      chunkText: { $regex: query, $options: "i" },
    }).populate("documentId");

    // Group matching chunks by Document
    const docMap = new Map();
    for (const chunk of chunks) {
      if (chunk.documentId) {
        const doc = chunk.documentId as any;
        if (!docMap.has(doc._id.toString())) {
          docMap.set(doc._id.toString(), {
            _id: doc._id,
            title: doc.title,
            sourceType: doc.sourceType,
            status: doc.status,
            createdAt: doc.createdAt,
            matchingSnippet: chunk.chunkText.substring(0, 200) + (chunk.chunkText.length > 200 ? "..." : ""),
          });
        }
      }
    }

    const matchedDocs = Array.from(docMap.values());

    return res.json({
      success: true,
      documents: matchedDocs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Document search failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 6. Fetch logged employee bugs & issues (Admin Only)
router.get("/admin/employee-issues", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const issues = await EmployeeIssueModel.find({}).sort({ createdAt: -1 });
    return res.json({
      success: true,
      issues,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee issues log",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// 7. Delete document and all associated chunks (Admin Only)
router.delete("/admin/documents/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deletion comment/reason is required",
      });
    }

    const doc = await DocumentModel.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete associated chunks
    await ChunkModel.deleteMany({ documentId: id });

    // Delete document metadata
    await DocumentModel.findByIdAndDelete(id);

    // Save audit log detailing the deletion and comment
    await AuditLogModel.create({
      action: "DELETE",
      targetId: id,
      targetType: "document",
      details: `Deleted data source "${doc.title}". Reason: ${comment}`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      message: "Data source and search index chunks deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete data source",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
