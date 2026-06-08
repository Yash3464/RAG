import {
  RequirementMasterModel,
} from "../models/RequirementMaster";

import {
  RequirementReviewModel,
} from "../models/RequirementReview";
import { createKnowledgeNode } from "./graph-builder.service";

export const publishToRequirementMaster =
  async (
    reviewId: string
  ) => {

    const review =
      await RequirementReviewModel.findById(
        reviewId
      );

    if (!review) {
      throw new Error(
        "Review not found"
      );
    }

    const analysis =
      review.analysis;

    const requirementCode =
      `REQ-${review._id}`;

    const existing =
      await RequirementMasterModel.findOne({
        requirementCode,
      });

    if (existing) {

      existing.title =
        analysis.refinedRequirement;

      existing.refinedRequirement =
        analysis.refinedRequirement;

      existing.assumptions =
        analysis.assumptions || [];

      existing.dependencies =
        analysis.dependencies || [];

      existing.version =
        review.version;

      await existing.save();

      return existing;
    }

    const record =
      await RequirementMasterModel.create({
        requirementCode,

        title:
          analysis.refinedRequirement,

        refinedRequirement:
          analysis.refinedRequirement,

        assumptions:
          analysis.assumptions || [],

        dependencies:
          analysis.dependencies || [],

        businessRules:
          [],

        version:
          review.version,

        sourceReviewId:
          review._id,

        status:
          "approved",
      });

    await createKnowledgeNode({
      nodeId: record.requirementCode,
      nodeType: "requirement",
      title: record.title,
      content: record.refinedRequirement,
      priority: "high",
      domain: "",
      module: "",
      tags: []
    });

    return record;
  };