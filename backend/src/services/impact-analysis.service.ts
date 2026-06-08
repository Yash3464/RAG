import {
  generateCompletion
} from "./llm.service";

export const generateImpactAnalysis =
async (
  requirement: string
) => {
  const prompt = `
You are an Enterprise Solution Architect.

FIRST determine whether the input is a valid software requirement, business rule, issue, bug, change request, feature request or product enhancement.

If it is NOT relevant return ONLY:

{
  "relevant": false,
  "message": "Input is not a valid project requirement.",
  "suggestion": "Please provide a software requirement, issue, bug, business rule or change request."
}

If it IS relevant return ONLY JSON:

{
  "relevant": true,
  "interpretedRequirement": "",
  "relevanceScore": 0,
  "businessValue": "low|medium|high",
  "implementationComplexity": "low|medium|high",
  "aiVerdict": "",

  "structureImpact": {
    "pages": [],
    "sections": [],
    "menus": [],
    "roles": [],
    "platforms": []
  },

  "datasetImpact": {
    "newTables": [],
    "modifiedTables": [],
    "fields": [],
    "relationships": []
  },

  "businessLogicImpact": {
    "apis": [],
    "functions": [],
    "workflows": []
  },

  "integrationImpact": {
    "existingIntegrations": [],
    "newIntegrations": []
  },

  "automationImpact": {
    "agents": [],
    "workflows": [],
    "notifications": []
  },

  "cmsImpact": {
    "collections": [],
    "contentTypes": []
  },

  "securityImpact": {
    "roles": [],
    "permissions": [],
    "compliance": []
  },

  "testingImpact": {
    "testCases": [],
    "regressionAreas": []
  },

  "deploymentImpact": {
    "infrastructure": [],
    "pipelines": []
  },

  "estimatedHours": 0,

  "riskLevel":
    "low|medium|high"
}

Rules:

For greetings like:

- hi
- hello
- thanks
- how are you
- good morning

Return relevant=false.

For vague requirements:

"I want to add vendors myself"

Convert to:

"The system should allow administrators to manually create vendor records"

Estimate hours using:

UI page = 8 hours
API = 12 hours
Database table = 10 hours
Workflow = 16 hours
Security area = 12 hours
Testing area = 6 hours

Total estimatedHours must be calculated from impacted areas.

Requirement:

${requirement}
`;

  const result =
    await generateCompletion(
      prompt,
      0.2
    );

  return JSON.parse(
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
};