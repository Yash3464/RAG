import mongoose from "mongoose";

const requirementRelationshipSchema =
  new mongoose.Schema(
    {
      sourceRequirementId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "RequirementMaster",
        required: true
      },

      targetRequirementId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "RequirementMaster",
        required: true
      },

      relationshipType: {
        type: String,
        enum: [
          "depends_on",
          "extends",
          "duplicates",
          "conflicts_with",
          "related_to"
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

export const RequirementRelationshipModel =
  mongoose.model(
    "RequirementRelationship",
    requirementRelationshipSchema
  );