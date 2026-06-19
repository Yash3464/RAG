import { generateCompletion } from "./llm.service";

export const compareSOWContexts = async (
  originalContext: string,
  newContext: string
) => {
  const cleanOriginal = (originalContext || "").length > 5000 
    ? (originalContext || "").substring(0, 5000) + "\n...[TRUNCATED TO PREVENT TOKEN LIMIT OVERFLOWS]..."
    : (originalContext || "");
  const cleanNew = (newContext || "").length > 5000 
    ? (newContext || "").substring(0, 5000) + "\n...[TRUNCATED TO PREVENT TOKEN LIMIT OVERFLOWS]..."
    : (newContext || "");

  const prompt = `
You are a Principal Product Manager and Technical Contract Auditor.

Compare the following original SOW "mainContext" with the newly uploaded SOW revision "newContext".
Identify any additions, modifications, or deletions in the new text compared to the original.

ORIGINAL MAIN CONTEXT:
${cleanOriginal}

NEW SOW REVISION CONTEXT:
${cleanNew}

Format your response as a valid JSON object matching the schema below.

JSON SCHEMA:
{
  "changes": [
    {
      "changeType": "addition",
      "section": "Section name/clause number",
      "description": "Explanation of what has been added.",
      "originalText": "",
      "newText": "Exact text added"
    },
    {
      "changeType": "modification",
      "section": "Section name/clause number",
      "description": "Explanation of what has changed.",
      "originalText": "Exact original text",
      "newText": "Exact new text"
    },
    {
      "changeType": "deletion",
      "section": "Section name/clause number",
      "description": "Explanation of what has been removed.",
      "originalText": "Exact original text removed",
      "newText": ""
    }
  ]
}

CRITICAL RULES:
- Return ONLY the raw JSON.
- DO NOT wrap in markdown \`\`\`json blocks.
- Be very precise with "originalText" and "newText" (copy them word-for-word from the contexts).
- If there are no differences, return {"changes": []}.
`;

  const responseText = await generateCompletion(prompt, 0.1);
  const cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleanText);
  return parsed.changes || [];
};
