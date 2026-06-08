import mongoose from "mongoose";

const userStorySchema =
  new mongoose.Schema(
    {
      requirementMasterId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref:
          "RequirementMaster",
        required: true
      },

      title: String,

      actor: String,

      action: String,

      benefit: String
    },
    {
      timestamps: true
    }
  );

export const UserStoryModel =
  mongoose.model(
    "UserStory",
    userStorySchema
  );