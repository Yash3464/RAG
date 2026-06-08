import mongoose from "mongoose";

const classificationSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry",
        required: true
      },

      type: {
        type: String,
        enum: [
          "requirement",
          "meeting_note",
          "decision",
          "business_rule",
          "change_request",
          "question",
          "assumption",
          "bug",
          "issue"
        ],
        required: true
      },

      confidence: {
        type: Number,
        default: 0
      }
    },
    {
      timestamps: true
    }
  );

export const ClassificationModel =
  mongoose.model(
    "Classification",
    classificationSchema
  );