import { generateCompletion } from "./llm.service";

const safeJsonParse = (text: string, fallback: any = {}) => {
  try {
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (innerError) {
      console.error("safeJsonParse relationship detector: Failed to parse:", text);
    }
    return fallback;
  }
};

export const detectRelationship = async (
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

  const result = await generateCompletion(prompt, 0);

  const fallback = { relationship: "none" };
  return safeJsonParse(result, fallback);
};