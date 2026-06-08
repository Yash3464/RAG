import mongoose from "mongoose";

const impactAnalysisSchema =
  new mongoose.Schema(
    {
      requirementMasterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RequirementMaster"
      },

      requirementTitle: String,

      structureImpact: {
        pages: [String],
        sections: [String],
        menus: [String],
        roles: [String],
        platforms: [String]
      },

      datasetImpact: {
        newTables: [String],
        modifiedTables: [String],
        fields: [String],
        relationships: [String]
      },

      businessLogicImpact: {
        apis: [String],
        functions: [String],
        workflows: [String]
      },

      integrationImpact: {
        existingIntegrations: [String],
        newIntegrations: [String]
      },

      automationImpact: {
        agents: [String],
        workflows: [String],
        notifications: [String]
      },

      cmsImpact: {
        collections: [String],
        contentTypes: [String]
      },

      securityImpact: {
        roles: [String],
        permissions: [String],
        compliance: [String]
      },

      testingImpact: {
        testCases: [String],
        regressionAreas: [String]
      },

      deploymentImpact: {
        infrastructure: [String],
        pipelines: [String]
      },

      estimatedHours: Number,

      riskLevel: {
        type: String,
        enum: [
          "low",
          "medium",
          "high"
        ]
      }
    },
    {
      timestamps: true
    }
  );

export const ImpactAnalysisModel =
  mongoose.model(
    "ImpactAnalysis",
    impactAnalysisSchema
  );