import {
  generateCompletion
} from "./llm.service";

export const analyzeBug =
async (
  bugDescription: string
) => {

  const prompt = `
You are a Senior Software Architect.

Analyze this bug.

BUG:
${bugDescription}

Return ONLY JSON.

{
  "rootCause":"",
  "severity":"medium",
  "fixPlan":[],
  "testCases":[],
  "estimatedHours":0
}
`;

  const result =
    await generateCompletion(
      prompt,
      0
    );

  return JSON.parse(
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
};