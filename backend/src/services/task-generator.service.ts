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

  try {
    const cleanText = result.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (innerError) {
      console.error("Failed to parse task generation:", result);
    }
    return {
      title: "Actionable Task",
      description: content,
      priority: "medium",
      acceptanceCriteria: []
    };
  }
};