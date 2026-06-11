import { Request, Response } from "express";
import { JournalEntryModel } from "../models/JournalEntry";
import { ClassificationModel } from "../models/Classification";
import { TaskModel } from "../models/Task";
import { ConflictModel } from "../models/Conflict";
import { RequirementReviewModel } from "../models/RequirementReview";
import { KnowledgeNodeModel } from "../models/KnowledgeNode";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";
import { planReleases } from "../services/release-planner.service";
import { AuditLogModel } from "../models/AuditLog";

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
        completed: (planned as any).completed?.length || 0,
      },
      release1: planned.release1,
      release2: planned.release2,
      release3: planned.release3,
      completed: (planned as any).completed || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateBacklogItemStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, releaseOverride } = req.body;

    const updateFields: any = {};
    if (status !== undefined) updateFields.status = status;
    if (releaseOverride !== undefined) updateFields.releaseOverride = releaseOverride;

    if (status === "completed") {
      updateFields.releaseOverride = null;
    }

    const updated = await JournalEntryModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Backlog item not found",
      });
    }

    // Document in audit logs
    await AuditLogModel.create({
      action: "UPDATE",
      targetId: id,
      targetType: updated.classification || "requirement",
      details: `Updated status to "${status !== undefined ? status : updated.status}" and release override to "${releaseOverride !== undefined ? releaseOverride : updated.releaseOverride}"`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      message: "Status and override updated successfully",
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const updateBacklogItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const item = await JournalEntryModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Backlog item not found",
      });
    }

    const currentVersions = item.versions || [];
    const nextVersionNumber = (item.version || currentVersions.length || 1) + 1;
    const userEmail = (req as any).user?.email || "admin@brained.ai";

    // If versions array is empty, populate V1 with current/old content
    if (currentVersions.length === 0) {
      currentVersions.push({
        versionNumber: 1,
        content: item.content,
        title: title || item.content.substring(0, 100),
        modifiedBy: "admin@brained.ai",
        createdAt: item.createdAt || new Date()
      });
    }

    const newSnapshot = {
      versionNumber: nextVersionNumber,
      content: content,
      title: title || content.substring(0, 100),
      modifiedBy: userEmail,
      createdAt: new Date()
    };

    currentVersions.push(newSnapshot);

    item.content = content;
    item.version = nextVersionNumber;
    item.versions = currentVersions;

    const updated = await item.save();

    // Sync changes to the Knowledge Graph node
    await KnowledgeNodeModel.findOneAndUpdate(
      { nodeId: id },
      { content, title: title || content.substring(0, 100) }
    );

    // Document in audit logs
    await AuditLogModel.create({
      action: "UPDATE",
      targetId: id,
      targetType: updated.classification || "requirement",
      details: `Updated specification content to: "${content.substring(0, 120)}${content.length > 120 ? "..." : ""}"`,
      performedBy: userEmail,
    });

    return res.json({
      success: true,
      message: "Backlog item content updated successfully",
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const getBacklogItemByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const item = await JournalEntryModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Backlog item not found",
      });
    }
    return res.json({
      success: true,
      item
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const rollbackBacklogItemVersionController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { targetVersion } = req.body;

    if (targetVersion === undefined || targetVersion === null) {
      return res.status(400).json({
        success: false,
        message: "targetVersion is required",
      });
    }

    const item = await JournalEntryModel.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Backlog item not found",
      });
    }

    const currentVersions = item.versions || [];
    if (currentVersions.length === 0) {
      currentVersions.push({
        versionNumber: 1,
        content: item.content,
        title: item.content.substring(0, 100),
        modifiedBy: "admin@brained.ai",
        createdAt: item.createdAt || new Date()
      });
    }

    const targetSnap = currentVersions.find((v: any) => v.versionNumber === Number(targetVersion));
    if (!targetSnap) {
      return res.status(400).json({
        success: false,
        message: `Version ${targetVersion} not found in history`,
      });
    }

    const nextVersionNumber = (item.version || currentVersions.length) + 1;
    const userEmail = (req as any).user?.email || "admin@brained.ai";

    const newSnapshot = {
      versionNumber: nextVersionNumber,
      content: targetSnap.content,
      title: targetSnap.title,
      modifiedBy: userEmail,
      createdAt: new Date()
    };

    currentVersions.push(newSnapshot);

    item.content = targetSnap.content;
    item.version = nextVersionNumber;
    item.versions = currentVersions;

    const updated = await item.save();

    // Sync changes to the Knowledge Graph node
    await KnowledgeNodeModel.findOneAndUpdate(
      { nodeId: id },
      { content: targetSnap.content, title: targetSnap.title }
    );

    // Document in audit logs
    await AuditLogModel.create({
      action: "UPDATE",
      targetId: id,
      targetType: updated.classification || "requirement",
      details: `Rolled back specification to Version ${targetVersion} (created Version ${nextVersionNumber})`,
      performedBy: userEmail,
    });

    return res.json({
      success: true,
      message: `Successfully rolled back to Version ${targetVersion}`,
      item: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteBacklogItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const deleted = await JournalEntryModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Backlog item not found",
      });
    }

    // Cascade delete associated entities
    await ClassificationModel.deleteMany({ journalId: id });
    await TaskModel.deleteMany({ journalId: id });
    await ConflictModel.deleteMany({ journalId: id });
    await RequirementReviewModel.deleteMany({ journalId: id });
    await KnowledgeNodeModel.deleteOne({ nodeId: id });
    await KnowledgeEdgeModel.deleteMany({
      $or: [
        { sourceNodeId: id },
        { targetNodeId: id }
      ]
    });

    // Document in audit logs
    await AuditLogModel.create({
      action: "DELETE",
      targetId: id,
      targetType: deleted.classification || "requirement",
      details: `Deleted backlog item: "${deleted.content.substring(0, 120)}${deleted.content.length > 120 ? "..." : ""}" (cascade deleted associated classification, tasks, conflict mappings, reviews, graph nodes, and edges)`,
      performedBy: (req as any).user?.email || "admin@brained.ai",
    });

    return res.json({
      success: true,
      message: "Backlog item and all associated data deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};