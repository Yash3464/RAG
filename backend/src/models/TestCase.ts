import mongoose from "mongoose";

const testCaseSchema =
  new mongoose.Schema(
    {
      requirementMasterId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref:
          "RequirementMaster"
      },

      title: String,

      preCondition: String,

      steps: [String],

      expectedResult: String
    },
    {
      timestamps: true
    }
  );

export const TestCaseModel =
  mongoose.model(
    "TestCase",
    testCaseSchema
  );