import {
  generateCompletion
} from "./llm.service";

export const generateTask =
async (
  content: string
) => {

  const prompt = `
You are a Senior Engineering Lead.

Create an actionable task.

CONTENT:
${content}

Return ONLY JSON.

{
  "title":"",
  "description":"",
  "priority":"medium",
  "acceptanceCriteria":[]
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