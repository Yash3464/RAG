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

export const detectRelationshipsBatch = async (
  sourceContent: string,
  candidates: { nodeId: string; title: string; content: string }[]
): Promise<{ nodeId: string; relationship: string }[]> => {
  if (candidates.length === 0) return [];

  const prompt = `
You are an AI-powered Knowledge Graph Agent. Determine relationships between the SOURCE requirement and the list of CANDIDATE requirements.

SOURCE requirement:
"${sourceContent}"

CANDIDATES:
${candidates.map((c, i) => `${i + 1}. NODE_ID: "${c.nodeId}"
   Title: "${c.title}"
   Content: "${c.content}"`).join("\n\n")}

For each candidate, analyze if there is a relationship with the SOURCE.
Allowed relationships:
- depends_on
- blocks
- impacts
- implements
- validates
- relates_to
- none (if there is no relationship)

Return ONLY a valid JSON array matching this schema (no markdown, no backticks, no text outside JSON):
[
  {
    "nodeId": "candidate_node_id",
    "relationship": "relationship_type"
  }
]
`;

  try {
    const result = await generateCompletion(prompt, 0);
    const cleanText = result.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      const match = cleanText.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw e;
      }
    }
    
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Batch relationship detection parse error:", error);
  }
  return [];
};