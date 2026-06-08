import {
  generateCompletion
} from "./llm.service";

export const analyzeRequirement =
async (
  content: string,
  context: any
) => {

  const prompt = `
You are a Senior Business Analyst and Enterprise Solution Architect.

You are analyzing a NEW requirement.

Before analyzing the requirement, review the EXISTING PROJECT CONTEXT.

================================================

EXISTING APPROVED REQUIREMENTS

${JSON.stringify(
  context.requirements,
  null,
  2
)}

================================================

EXISTING JOURNAL ENTRIES

${JSON.stringify(
  context.journalEntries,
  null,
  2
)}

================================================

NEW REQUIREMENT

${content}

================================================

Perform the following analysis:

1. Identify Missing Information
2. Identify Ambiguities
3. Identify Assumptions
4. Identify Dependencies
5. Identify Edge Cases
6. Identify Conflicts With Existing Context
7. Generate Functional Requirements
8. Generate Non Functional Requirements
9. Generate Clarification Questions
10. Generate Refined Requirement

Conflict Detection Rules:

- Detect duplicate requirements
- Detect contradictory requirements
- Detect business rule conflicts
- Detect workflow conflicts
- Detect security conflicts
- Detect role/permission conflicts

IMPORTANT:

Return ONLY valid JSON.

DO NOT return markdown.

DO NOT wrap response inside \`\`\`json

Use this schema exactly:

{
  "missingInformation": [],
  "ambiguities": [],
  "assumptions": [],
  "dependencies": [],
  "edgeCases": [],
  "conflicts": [],
  "functionalRequirements": [],
  "nonFunctionalRequirements": [],
  "clarificationQuestions": [],
  "refinedRequirement": ""
}
`;

  const result =
    await generateCompletion(
      prompt,
      0.2
    );

  console.log(
    "LLM RESPONSE:",
    result
  );

  const cleanedResult =
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

  try {

    return JSON.parse(
      cleanedResult
    );

  } catch (error) {

    console.error(
      "JSON Parse Error:",
      error
    );

    return {
      missingInformation: [],
      ambiguities: [],
      assumptions: [],
      dependencies: [],
      edgeCases: [],
      conflicts: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      clarificationQuestions: [],
      refinedRequirement:
        "Failed to parse AI response"
    };
  }
};