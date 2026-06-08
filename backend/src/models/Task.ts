import mongoose from "mongoose";

const taskSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      title: {
        type: String,
        required: true
      },

      description: {
        type: String,
        default: ""
      },

      taskType: {
        type: String,
        enum: [
          "requirement",
          "bug",
          "issue",
          "change_request",
          "general"
        ],
        default: "general"
      },

      sourceId: {
        type: String,
        default: null
      },

      priority: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "critical"
        ],
        default: "medium"
      },

      priorityScore: {
        type: Number,
        default: 0
      },

      status: {
        type: String,
        enum: [
          "pending",
          "in_progress",
          "blocked",
          "completed",
          "cancelled"
        ],
        default: "pending"
      },

      completionPercentage: {
        type: Number,
        default: 0
      },
      
      estimatedHours: {
        type: Number,
        default: 0
      },

      assignedTo: {
        type: String,
        default: ""
      },

      dueDate: {
        type: Date
      },

      aiGenerated: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

export const TaskModel =
  mongoose.model(
    "Task",
    taskSchema
  );