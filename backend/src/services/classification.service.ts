import { generateCompletion } from "./llm.service";

export const classifyContent = async (content: string) => {
  const text = content.trim().toLowerCase();

  // Quick keywords check for greetings & general conversation
  const greetings = ["hi", "hello", "hey", "how are you", "how are u", "good morning", "good afternoon", "good evening", "thanks", "thank you"];
  if (greetings.includes(text) || text.length < 3) {
    return {
      type: "irrelevant",
      confidence: 100
    };
  }

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
Classify the following text into one of these categories:
- requirement
- business_rule
- task
- change_request
- approval
- decision
- assumption
- bug
- issue
- irrelevant (use this for general greetings like hi/hello, general chat, or content completely unrelated to software engineering/requirements)

Return ONLY JSON:

{
 "type":"",
 "confidence":0
}

CONTENT:
${content}
`;

  const result = await generateCompletion(prompt, 0);

  try {
    return JSON.parse(
      result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );
  } catch (error) {
    console.error("Failed to parse classification output:", result);
    return {
      type: "requirement",
      confidence: 50
    };
  }
};