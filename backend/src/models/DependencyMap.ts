import mongoose from "mongoose";

const dependencyMapSchema =
  new mongoose.Schema(
    {
      requirementMasterId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref:
          "RequirementMaster"
      },

      modules: [String],

      apis: [String],

      tables: [String],

      workflows: [String],

      services: [String]
    },
    {
      timestamps: true
    }
  );

export const DependencyMapModel =
  mongoose.model(
    "DependencyMap",
    dependencyMapSchema
  );