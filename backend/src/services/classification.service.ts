import { generateCompletion }
from "./llm.service";

export const classifyContent =
async (
  content: string
) => {

  const text =
    content.toLowerCase();

  if (
    text.includes("bug") ||
    text.includes("error") ||
    text.includes("500") ||
    text.includes("crash") ||
    text.includes("fails") ||
    text.includes("failure")
  ) {
    return {
      type: "bug",
      confidence: 95
    };
  }

  if (
    text.includes("issue") ||
    text.includes("problem") ||
    text.includes("risk") ||
    text.includes("blocker") ||
    text.includes("complaining")
  ) {
    return {
      type: "issue",
      confidence: 95
    };
  }

  if (
    text.includes("must") ||
    text.includes("shall") ||
    text.includes("should") ||
    text.includes("required") ||
    text.includes("need to")
  ) {
    return {
      type: "requirement",
      confidence: 95
    };
  }

  const prompt = `
Classify into:
requirement
business_rule
task
change_request
approval
decision
assumption
bug
issue

Return ONLY JSON.

{
 "type":"",
 "confidence":0
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
      .replace(/```json/g,"")
      .replace(/```/g,"")
      .trim()
  );
};