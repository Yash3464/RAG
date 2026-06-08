import {KnowledgeNodeModel} from "../models/KnowledgeNode";
import {KnowledgeEdgeModel} from "../models/KnowledgeEdge";

export const buildTraceabilityMatrix =
async () => {

  const nodes =
    await KnowledgeNodeModel.find({});

  const edges =
    await KnowledgeEdgeModel.find({});

  return nodes.map(
    (node: any) => ({

      nodeId:
        node.nodeId,

      title:
        node.title,

      relationships:
        edges.filter(
          (edge: any) =>
            edge.sourceNodeId ===
            node.nodeId
        )
    })
  );
};