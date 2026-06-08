import {
  detectRelationship
} from "./ai-relationship-detector.service";

import {
  createKnowledgeEdge
} from "./graph-builder.service";

export const detectEdges =
async (
  sourceNode: any,
  relatedNodes: any[]
) => {

  let edgesCreated = 0;

  for (
    const targetNode
    of relatedNodes
  ) {

    const relationship =
      await detectRelationship(
        sourceNode.content,
        targetNode.content
      );

    if (
      relationship.relationship !==
      "none"
    ) {

      await createKnowledgeEdge(
        sourceNode.nodeId,
        targetNode.nodeId,
        relationship.relationship
      );

      edgesCreated++;
    }
  }

  return edgesCreated;
};