import mongoose from "mongoose";

const requirementSchema =
  new mongoose.Schema(
    {
      title: String,

      refinedRequirement: String,

      assumptions: [String],

      dependencies: [String],

      businessRules: [String],

      version: {
        type: Number,
        default: 1,
      },

      status: {
        type: String,
        default: "approved",
      },
    },
    {
      timestamps: true,
    }
  );

export const RequirementModel =
  mongoose.model(
    "Requirement",
    requirementSchema
  );