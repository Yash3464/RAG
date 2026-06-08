import {
  generateCompletion
} from "./llm.service";

export const enrichMetadata =
async (
  content: string,
  classification: string
) => {

  const prompt = `
You are a Requirements Intelligence System.

Analyze the content and extract metadata.

CLASSIFICATION:
${classification}

CONTENT:
${content}

Return ONLY JSON.

{
  "domain": "",
  "module": "",
  "tags": []
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
