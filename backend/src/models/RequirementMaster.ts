import mongoose from "mongoose";

const requirementMasterSchema =
  new mongoose.Schema(
    {
      requirementCode: {
        type: String,
        required: true,
        unique: true,
      },

      title: String,

      refinedRequirement: String,

      assumptions: [String],

      dependencies: [String],

      businessRules: [String],

      version: {
        type: Number,
        default: 1,
      },

      sourceReviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RequirementReview",
      },

      status: {
        type: String,
        enum: [
            "draft",
            "under_review",
            "change_requested",
            "pending_approval",
            "approved",
            "deprecated",
            "archived"
        ],
        default: "approved"
      },
    },
    {
      timestamps: true,
    }
  );

export const RequirementMasterModel =
  mongoose.model(
    "RequirementMaster",
    requirementMasterSchema
  );