import {
  KnowledgeEdgeModel
} from "../models/KnowledgeEdge";

export const analyzeGraphImpact =
async (
  nodeId: string,
  visited = new Set<string>()
): Promise<string[]> => {

  if (visited.has(nodeId)) {
    return [];
  }

  visited.add(nodeId);

  const edges =
    await KnowledgeEdgeModel.find({
      sourceNodeId: nodeId
    });

  let impacted: string[] = [];

  for (const edge of edges) {

    impacted.push(
      edge.targetNodeId
    );

    const children =
      await analyzeGraphImpact(
        edge.targetNodeId,
        visited
      );

    impacted.push(
      ...children
    );
  }

  return [...new Set(impacted)];
};