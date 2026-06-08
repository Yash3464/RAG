import mongoose from "mongoose";

const conflictSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      type: String,

      severity: String,

      description: String,

      resolved: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

export const ConflictModel =
  mongoose.model(
    "Conflict",
    conflictSchema
  );