import {
  RequirementRelationshipModel
} from "../models/RequirementRelationship";

import {
  detectRelationships
} from "./relationship-detector.service";

export const createRelationships =
async (
  requirementId: string
) => {

  const relationships =
    await detectRelationships(
      requirementId
    );

  const saved = [];

  for (const rel of relationships) {

    const relationship =
      await RequirementRelationshipModel.create({
        sourceRequirementId:
          requirementId,

        targetRequirementId:
          rel.targetRequirementId,

        relationshipType:
          rel.relationshipType,

        confidence:
          rel.confidence
      });

    saved.push(
      relationship
    );
  }

  return saved;
};