import {
  detectRelationshipsBatch
} from "./ai-relationship-detector.service";

import {
  createKnowledgeEdge
} from "./graph-builder.service";

export const detectEdges =
async (
  sourceNode: any,
  relatedNodes: any[]
) => {
  if (!relatedNodes || relatedNodes.length === 0) return 0;

  const candidates = relatedNodes.map((n: any) => ({
    nodeId: n.nodeId,
    title: n.title,
    content: n.content
  }));

  const results = await detectRelationshipsBatch(sourceNode.content, candidates);

  let edgesCreated = 0;
  for (const res of results) {
    if (res.relationship && res.relationship !== "none") {
      await createKnowledgeEdge(
        sourceNode.nodeId,
        res.nodeId,
        res.relationship
      );
      edgesCreated++;
    }
  }

  return edgesCreated;
};