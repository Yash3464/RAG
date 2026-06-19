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

  const cleanText = result.replace(/```json/gi, "").replace(/```/g, "").trim();
  let mapping: any;
  try {
    mapping = JSON.parse(cleanText);
  } catch (e) {
    try {
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) {
        mapping = JSON.parse(match[0]);
      } else {
        throw e;
      }
    } catch (innerError) {
      mapping = { modules: [], apis: [], tables: [], workflows: [], services: [] };
    }
  }

  const normalizeToStringArray = (arr: any): string[] => {
    if (!arr) return [];
    const target = Array.isArray(arr) ? arr : [arr];
    return target.map((item: any) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        if (item.name && item.description) {
          return `${item.name}: ${item.description}`;
        }
        if (item.name && Array.isArray(item.columns)) {
          return `${item.name} (Columns: ${item.columns.join(", ")})`;
        }
        if (item.name && Array.isArray(item.steps)) {
          return `${item.name} (Steps: ${item.steps.join(" -> ")})`;
        }
        if (item.name) {
          return item.name;
        }
        return JSON.stringify(item);
      }
      return String(item);
    });
  };

  return await DependencyMapModel.create({
    requirementMasterId,
    modules: normalizeToStringArray(mapping.modules),
    apis: normalizeToStringArray(mapping.apis),
    tables: normalizeToStringArray(mapping.tables),
    workflows: normalizeToStringArray(mapping.workflows),
    services: normalizeToStringArray(mapping.services)
  });
};