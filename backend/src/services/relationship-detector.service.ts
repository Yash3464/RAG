import {RequirementMasterModel} from "../models/RequirementMaster";
import {generateCompletion} from "./llm.service";
import {KnowledgeNodeModel} from "../models/KnowledgeNode";

export const findRelatedNodes =
async (
  content: string
) => {

  const nodes =
    await KnowledgeNodeModel.find({});

  return nodes.filter(
    (node: any) =>
      content
        .toLowerCase()
        .includes(
          node.title?.toLowerCase() || ""
        )
  );
};

export const detectRelationships =
async (
  sourceRequirementId: string
) => {

  const source =
    await RequirementMasterModel.findById(
      sourceRequirementId
    );

  if (!source) {
    throw new Error(
      "Requirement not found"
    );
  }

  const others =
    await RequirementMasterModel.find({
      _id: {
        $ne: source._id
      },
      status: "approved"
    });

  if (!others.length) {
    return [];
  }

  const prompt = `
You are an Enterprise Architect.

SOURCE REQUIREMENT

${source.refinedRequirement}

EXISTING REQUIREMENTS

${JSON.stringify(
  others.map(r => ({
    id: r._id,
    requirementCode:
      r.requirementCode,
    requirement:
      r.refinedRequirement
  })),
  null,
  2
)}

Determine relationships.

Allowed relationship types:

- depends_on
- extends
- duplicates
- conflicts_with
- related_to

Return ONLY JSON.

[
  {
    "targetRequirementId": "",
    "relationshipType": "",
    "confidence": 0.9
  }
]
`;

  const result =
    await generateCompletion(
      prompt,
      0.1
    );

  return JSON.parse(
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
};