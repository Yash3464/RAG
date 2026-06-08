import mongoose from "mongoose";

const requirementReviewSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      analysis: {
        type: Object,
        required: true
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
          "change_requested"
        ],
        default: "pending"
      },

      userComments: {
        type: String,
        default: ""
      },

      version: {
        type: Number,
        default: 1
      },

      reviewHistory: [
        {
          action: String,
          comments: String,
          createdAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },
    {
      timestamps: true
    }
  );

export const RequirementReviewModel =
  mongoose.model(
    "RequirementReview",
    requirementReviewSchema
  );