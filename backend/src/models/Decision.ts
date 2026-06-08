import mongoose from "mongoose";

const decisionSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      decision: {
        type: String,
        required: true
      },

      approved: {
        type: Boolean,
        default: false
      }
    },
    {
      timestamps: true
    }
  );

export const DecisionModel =
  mongoose.model(
    "Decision",
    decisionSchema
  );