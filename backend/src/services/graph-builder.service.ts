import {
  KnowledgeNodeModel
} from "../models/KnowledgeNode";

import {
  KnowledgeEdgeModel
} from "../models/KnowledgeEdge";

export const createKnowledgeNode =
async (
  data: any
) => {

  return KnowledgeNodeModel.create({
    nodeId:
      data.nodeId,

    nodeType:
      data.nodeType,

    title:
      data.title,

    content:
      data.content,

    priority:
      data.priority,

    domain:
      data.domain,

    module:
      data.module,

    tags:
      data.tags || []
  });
};

export const createKnowledgeEdge =
async (
  sourceNodeId: string,
  targetNodeId: string,
  relationshipType: string
) => {

  return KnowledgeEdgeModel.create({
    sourceNodeId,
    targetNodeId,
    relationshipType
  });
};