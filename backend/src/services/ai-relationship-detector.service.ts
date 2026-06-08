import {
  generateCompletion
} from "./llm.service";

export const detectRelationship =
async (
  sourceContent: string,
  targetContent: string
) => {

  const prompt = `
Determine the relationship between:

SOURCE:
${sourceContent}

TARGET:
${targetContent}

Allowed relationships:

depends_on
blocks
impacts
implements
validates
relates_to
none

Return ONLY JSON:

{
  "relationship": ""
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