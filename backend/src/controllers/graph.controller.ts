import { Request, Response } from "express";
import { KnowledgeNodeModel } from "../models/KnowledgeNode";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";

export const getNodeGraphController = async (
  req: Request,
  res: Response
) => {
  try {
    const { nodeId } = req.params;

    if (!nodeId) {
      return res.status(400).json({
        success: false,
        message: "Node ID is required"
      });
    }

    let effectiveNodeId = nodeId;
    let detailedRequirement = null;

    // Try to find if this nodeId is a JournalEntry linked to an approved review
    const { RequirementReviewModel } = require("../models/RequirementReview");
    const { RequirementMasterModel } = require("../models/RequirementMaster");
    const review = await RequirementReviewModel.findOne({ journalId: nodeId });
    if (review && review.status === "approved") {
      const requirementCode = `REQ-${review._id}`;
      const masterRecord = await RequirementMasterModel.findOne({ requirementCode });
      if (masterRecord) {
        effectiveNodeId = requirementCode;
        detailedRequirement = masterRecord;
      }
    }

    // 1. Fetch central node
    let centralNode = await KnowledgeNodeModel.findOne({ nodeId: effectiveNodeId });
    if (!centralNode && effectiveNodeId !== nodeId) {
      centralNode = await KnowledgeNodeModel.findOne({ nodeId });
      effectiveNodeId = nodeId;
    }

    if (!centralNode) {
      return res.status(404).json({
        success: false,
        message: "Requirement graph node not found"
      });
    }

    // 2. Fetch direct connections (edges)
    const edges = await KnowledgeEdgeModel.find({
      $or: [
        { sourceNodeId: effectiveNodeId },
        { targetNodeId: effectiveNodeId }
      ]
    }).lean();

    // 3. Find unique connected node IDs
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(effectiveNodeId as string);
    
    for (const edge of edges as any[]) {
      connectedNodeIds.add(edge.sourceNodeId as string);
      connectedNodeIds.add(edge.targetNodeId as string);
    }

    // 4. Fetch all connected nodes
    const nodes = await KnowledgeNodeModel.find({
      nodeId: { $in: Array.from(connectedNodeIds) }
    }).lean();

    return res.json({
      success: true,
      graph: {
        centralNode,
        nodes,
        edges
      },
      detailedRequirement
    });

  } catch (error) {
    console.error("Get node graph controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve local knowledge graph",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
