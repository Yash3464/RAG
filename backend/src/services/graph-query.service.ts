import {
  KnowledgeEdgeModel
} from "../models/KnowledgeEdge";

import {
  KnowledgeNodeModel
} from "../models/KnowledgeNode";

export const getConnectedNodes =
async (
  nodeId: string
) => {

  const edges =
    await KnowledgeEdgeModel.find({
      sourceNodeId: nodeId
    });

  const targetIds =
    edges.map(
      edge => edge.targetNodeId
    );

  return KnowledgeNodeModel.find({
    nodeId: {
      $in: targetIds
    }
  });
};