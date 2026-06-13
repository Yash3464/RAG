import { generateCompletion } from "./llm.service";
import { RequirementMasterModel } from "../models/RequirementMaster";
import { FRDModel } from "../models/FRD";

export const generateFRD = async (requirementMasterId: string) => {
  const requirement = await RequirementMasterModel.findById(requirementMasterId);
  if (!requirement) {
    throw new Error("Requirement Master record not found");
  }

  const prompt = `
You are a Principal Technical Product Manager and Enterprise Solution Architect.

Generate a comprehensive Functional Requirement Document (FRD) for the following approved requirement specification.

REQUIREMENT TITLE:
${requirement.title}

REFINED REQUIREMENT DETAIL:
${requirement.refinedRequirement}

ASSUMPTIONS:
${(requirement.assumptions || []).join("\n")}

DEPENDENCIES:
${(requirement.dependencies || []).join("\n")}

Format your response as a valid JSON object matching the schema below.

JSON SCHEMA:
{
  "introduction": "Brief description of what this requirement solves, background, and target value.",
  "userStories": [
    {
      "title": "Short title describing the story",
      "actor": "User/Admin/System role",
      "action": "What they want to do",
      "benefit": "Why they want to do it / business benefit",
      "acceptanceCriteria": [
        "Scenario 1: Detailed functional step to verify success.",
        "Scenario 2: Detailed negative path or edge case validation."
      ]
    }
  ],
  "businessRules": [
    "Strict rule 1 (e.g., wallet withdrawals > $10k require compliance manager signoff)",
    "Strict rule 2"
  ],
  "workflowDiagram": "Mermaid.js flowchart code visualizing the execution flow. Example format: graph TD\\n  A[Start] --> B[Step]... Use TD layout, and valid Mermaid syntax. Do not wrap in backticks."
}

CRITICAL RULES:
- Return ONLY the raw JSON.
- DO NOT wrap in markdown \`\`\`json blocks.
- Ensure all fields are fully populated with highly realistic, production-ready product specifications.
- Do not use placeholders.
`;

  const responseText = await generateCompletion(prompt, 0.2);
  let cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanText);
    
    // Save to database
    const frd = await FRDModel.findOneAndUpdate(
      { requirementMasterId },
      {
        requirementMasterId,
        introduction: parsed.introduction || `Functional specification for ${requirement.title}`,
        userStories: parsed.userStories || [],
        businessRules: parsed.businessRules || [],
        workflowDiagram: parsed.workflowDiagram || "graph TD\n  Start[Start] --> End[End]"
      },
      { upsert: true, new: true }
    );
    
    return frd;
  } catch (error) {
    console.error("FRD JSON parsing error. Attempting regex match.", error);
    try {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const frd = await FRDModel.findOneAndUpdate(
          { requirementMasterId },
          {
            requirementMasterId,
            introduction: parsed.introduction || `Functional specification for ${requirement.title}`,
            userStories: parsed.userStories || [],
            businessRules: parsed.businessRules || [],
            workflowDiagram: parsed.workflowDiagram || "graph TD\n  Start[Start] --> End[End]"
          },
          { upsert: true, new: true }
        );
        return frd;
      }
    } catch (innerErr) {
      console.error("Failed to rescue FRD generation:", innerErr);
    }
    
    // Fallback save
    const fallbackFrd = await FRDModel.findOneAndUpdate(
      { requirementMasterId },
      {
        requirementMasterId,
        introduction: `Functional requirement document for ${requirement.title}.`,
        userStories: [
          {
            title: `Manage ${requirement.title}`,
            actor: "Admin",
            action: `Implement functional requirements for ${requirement.title}`,
            benefit: "Streamline product development and tracking",
            acceptanceCriteria: ["System successfully saves records", "System validates parameters"]
          }
        ],
        businessRules: ["Rule 1: Verify data integrity before database saves."],
        workflowDiagram: "graph TD\n  Start[Initiate] --> Process[Verify Specifications] --> Finish[Complete Master Entry]"
      },
      { upsert: true, new: true }
    );
    return fallbackFrd;
  }
};
