import {
  generateCompletion
} from "./llm.service";

export const extractContext =
async (
  content: string
) => {

  const prompt = `
Extract project knowledge.

Return ONLY JSON.

{
  "requirements": [],
  "businessRules": [],
  "tasks": [],
  "changeRequests": [],
  "approvals": [],
  "decisions": [],
  "assumptions": [],
  "bugs": [],
  "issues": []
}

CONTENT:
${content}
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