import {
  RequirementRelationshipModel
} from "../models/RequirementRelationship";

import {
  ChangeImpactModel
} from "../models/ChangeImpact";

export const propagateChanges =
async (
  requirementMasterId: string
) => {

  const relationships =
    await RequirementRelationshipModel.find({
      sourceRequirementId:
        requirementMasterId
    });

  const impacts = [];

  for (
    const relationship
    of relationships
  ) {

    const impact =
      await ChangeImpactModel.create({
        sourceRequirementId:
          requirementMasterId,

        impactedRequirementId:
          relationship.targetRequirementId,

        relationshipType:
          relationship.relationshipType,

        impactReason:
          `Requirement changed and impacts a related requirement`
      });

    impacts.push(
      impact
    );
  }

  return impacts;
};