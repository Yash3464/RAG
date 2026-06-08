import mongoose from "mongoose";

const journalEntrySchema =
  new mongoose.Schema(
    {
      content: {
        type: String,
        required: true,
      },

      sourceType: {
        type: String,
        enum: [
          "manual",
          "meeting",
          "document",
          "email"
        ],
        default: "manual",
      },

      classification: {
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
        default: "requirement",
      },

      status: {
        type: String,
        enum: [
          "draft",
          "under_review",
          "approved",
          "rejected",
          "closed"
        ],
        default: "draft",
      },

      priority: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "critical"
        ],
        default: "medium",
      },

      priorityScore: {
        type: Number,
        default: 0,
      },

      domain: {
        type: String,
        default: "",
      },

      module: {
        type: String,
        default: "",
      },

      tags: {
        type: [String],
        default: [],
      },

      priorityReason: {
        type: [String],
        default: [],
      },

      version: {
        type: Number,
        default: 1,
      },

      estimatedDevelopmentHours: {
        type: Number,
        default: 0
      },

      estimatedTestingHours: {
        type: Number,
        default: 0
      },

      estimatedReviewHours: {
        type: Number,
        default: 0
      },

      estimatedDocumentationHours: {
        type: Number,
        default: 0
      },

      estimatedComputeHours: {
        type: Number,
        default: 0
      },

      complexityScore: {
        type: Number,
        default: 0
      }
    },
    {
      timestamps: true,
    }
  );

export const JournalEntryModel =
  mongoose.model(
    "JournalEntry",
    journalEntrySchema
  );
  