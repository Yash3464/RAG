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
      console.error("safeJsonParse priority classifier: Failed to extract and parse JSON from text:", text);
    }
    return fallback;
  }
};

export const classifyPriority = async (
  content: string,
  classification: string
) => {
  const prompt = `
You are a Senior Product Manager.

Analyze the following item.

CONTENT:
${content}

TYPE:
${classification}

Evaluate:

1. Business Impact (0-25)
2. Compliance Impact (0-25)
3. Security Impact (0-20)
4. User Impact (0-20)
5. Dependency Impact (0-10)

Return ONLY JSON:

{
  "businessImpact": 0,
  "complianceImpact": 0,
  "securityImpact": 0,
  "userImpact": 0,
  "dependencyImpact": 0,
  "reasoning": []
}
`;

  const result = await generateCompletion(prompt, 0.2);

  const fallback = {
    businessImpact: 15,
    complianceImpact: 10,
    securityImpact: 10,
    userImpact: 15,
    dependencyImpact: 5,
    reasoning: ["Classification fell back to default parameters."]
  };

  const parsed = safeJsonParse(result, fallback);

  const score =
    (parsed.businessImpact || 0) +
    (parsed.complianceImpact || 0) +
    (parsed.securityImpact || 0) +
    (parsed.userImpact || 0) +
    (parsed.dependencyImpact || 0);

  let priority = "low";

  if (score >= 75) {
    priority = "critical";
  } else if (score >= 60) {
    priority = "high";
  } else if (score >= 40) {
    priority = "medium";
  }

  return {
    ...parsed,
    totalScore: score,
    priority
  };
};