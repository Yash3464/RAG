import {
  generateCompletion
} from "./llm.service";

export const classifyPriority =
async (
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

  const result =
    await generateCompletion(
      prompt,
      0.2
    );

  const parsed =
    JSON.parse(
      result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );

  const score =
    parsed.businessImpact +
    parsed.complianceImpact +
    parsed.securityImpact +
    parsed.userImpact +
    parsed.dependencyImpact;

  let priority =
    "low";

  if (score >= 90) {
    priority = "critical";
  } else if (score >= 70) {
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