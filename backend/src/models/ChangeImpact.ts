import mongoose from "mongoose";

const changeImpactSchema =
  new mongoose.Schema(
    {
      sourceRequirementId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref:
          "RequirementMaster",
        required: true
      },

      impactedRequirementId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref:
          "RequirementMaster",
        required: true
      },

      relationshipType: {
        type: String
      },

      impactReason: {
        type: String
      },

      status: {
        type: String,
        default: "open"
      }
    },
    {
      timestamps: true
    }
  );

export const ChangeImpactModel =
  mongoose.model(
    "ChangeImpact",
    changeImpactSchema
  );