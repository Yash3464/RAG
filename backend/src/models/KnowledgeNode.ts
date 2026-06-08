import mongoose from "mongoose";

const knowledgeNodeSchema =
  new mongoose.Schema(
    {
      nodeId: {
        type: String,
        required: true,
        unique: true
      },

      nodeType: {
        type: String,
        enum: [
          "requirement",
          "business_rule",
          "task",
          "change_request",
          "approval",
          "decision",
          "assumption",
          "bug",
          "issue"
        ],
        required: true
      },

      title: String,

      content: String,

      priority: String,

      domain: String,

      module: String,

      tags: [String]
    },
    {
      timestamps: true
    }
  );

export const KnowledgeNodeModel =
  mongoose.model(
    "KnowledgeNode",
    knowledgeNodeSchema
  );