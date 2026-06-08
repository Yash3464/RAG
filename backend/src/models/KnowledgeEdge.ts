import mongoose from "mongoose";

const knowledgeEdgeSchema =
  new mongoose.Schema(
    {
      sourceNodeId: {
        type: String,
        required: true
      },

      targetNodeId: {
        type: String,
        required: true
      },

      relationshipType: {
        type: String,
        enum: [
          "depends_on",
          "blocks",
          "impacts",
          "relates_to",
          "implements",
          "validates",
          "generates"
        ],
        required: true
      }
    },
    {
      timestamps: true
    }
  );

export const KnowledgeEdgeModel =
  mongoose.model(
    "KnowledgeEdge",
    knowledgeEdgeSchema
  );