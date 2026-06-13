import mongoose from "mongoose";

const frdSchema = new mongoose.Schema(
  {
    requirementMasterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequirementMaster",
      required: true,
      unique: true
    },
    introduction: {
      type: String,
      required: true
    },
    userStories: [
      {
        title: String,
        actor: String,
        action: String,
        benefit: String,
        acceptanceCriteria: [String]
      }
    ],
    businessRules: [String],
    workflowDiagram: String // Mermaid.js flowchart code
  },
  {
    timestamps: true
  }
);

export const FRDModel = mongoose.model("FRD", frdSchema);
