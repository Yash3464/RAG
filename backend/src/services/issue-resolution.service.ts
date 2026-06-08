import {
  generateCompletion
} from "./llm.service";

export const analyzeIssue =
async (
  issue: string
) => {

  const prompt = `
You are a Senior Product Manager.

Analyze this project issue.

ISSUE:
${issue}

Return ONLY JSON.

{
  "rootCause":"",
  "businessImpact":"",
  "recommendations":[],
  "estimatedImprovement":"",
  "priority":"medium"
}
`;

  const result =
    await generateCompletion(
      prompt,
      0
    );

  return JSON.parse(
    result
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim()
  );
};