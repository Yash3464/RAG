import {
  KnowledgeNodeModel
} from "../models/KnowledgeNode";

import {
  KnowledgeEdgeModel
} from "../models/KnowledgeEdge";

export const getGraphMetrics =
async () => {

  return {
    nodes:
      await KnowledgeNodeModel.countDocuments(),

    edges:
      await KnowledgeEdgeModel.countDocuments(),

    requirements:
      await KnowledgeNodeModel.countDocuments({
        nodeType: "requirement"
      }),

    bugs:
      await KnowledgeNodeModel.countDocuments({
        nodeType: "bug"
      }),

    issues:
      await KnowledgeNodeModel.countDocuments({
        nodeType: "issue"
      }),

    highPriorityNodes:
      await KnowledgeNodeModel.countDocuments({
        priority: {
          $in: [
            "high",
            "critical"
          ]
        }
      })
  };
};