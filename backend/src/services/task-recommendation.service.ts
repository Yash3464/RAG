import { generateCompletion }
from "./llm.service";

export const recommendTasks =
async (
  content: string
) => {

  const prompt = `
You are a Senior Engineering Manager.

Based on the following requirement,
bug or issue, recommend tasks.

CONTENT:
${content}

Return ONLY JSON.

{
  "tasks":[
    {
      "title":"",
      "description":"",
      "priority":"high"
    }
  ]
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