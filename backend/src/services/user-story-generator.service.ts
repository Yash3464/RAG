import {generateCompletion} from "./llm.service";

export const generateUserStories =
async (
  requirement: string
) => {

  const prompt = `
Convert the requirement into user stories.

Requirement:
${requirement}

Return ONLY JSON.

{
  "stories": [
    {
      "title": "",
      "actor": "",
      "action": "",
      "benefit": ""
    }
  ]
}
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