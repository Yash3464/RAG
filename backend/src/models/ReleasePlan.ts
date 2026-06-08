import mongoose from "mongoose";

const releasePlanSchema =
  new mongoose.Schema(
    {
      releaseName: String,

      requirements: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref:
            "RequirementMaster"
        }
      ],

      estimatedHours: Number,

      riskLevel: String
    },
    {
      timestamps: true
    }
  );

export const ReleasePlanModel =
  mongoose.model(
    "ReleasePlan",
    releasePlanSchema
  );