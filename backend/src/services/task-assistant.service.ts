import {generateCompletion} from "./llm.service";

export const generateTaskPlan =
async (
  taskTitle: string,
  taskDescription: string
) => {

  const prompt = `
You are a Senior Solution Architect.

Task:
${taskTitle}

Description:
${taskDescription}

Generate:

1. Implementation Steps
2. Acceptance Criteria
3. Risks
4. Test Cases

Return ONLY JSON.

{
  "steps": [],
  "acceptanceCriteria": [],
  "risks": [],
  "testCases": []
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