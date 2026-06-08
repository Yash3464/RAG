import {
  RequirementMasterModel
} from "../models/RequirementMaster";

import {
  DependencyMapModel
} from "../models/DependencyMap";

import {
  generateCompletion
} from "./llm.service";

export const createDependencyMap =
async (
  requirementMasterId: string
) => {

  const requirement =
    await RequirementMasterModel.findById(
      requirementMasterId
    );

  if (!requirement) {
    throw new Error(
      "Requirement not found"
    );
  }

  const prompt = `
You are an Enterprise Architect.

Requirement:

${requirement.refinedRequirement}

Identify:

1. Modules
2. APIs
3. Database Tables
4. Workflows
5. Services

Return ONLY JSON.

{
  "modules": [],
  "apis": [],
  "tables": [],
  "workflows": [],
  "services": []
}
`;

  const result =
    await generateCompletion(
      prompt,
      0.1
    );

  const mapping =
    JSON.parse(
      result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );

  return await DependencyMapModel.create({
    requirementMasterId,
    ...mapping
  });
};