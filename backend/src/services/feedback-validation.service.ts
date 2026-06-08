import {
  generateCompletion
} from "./llm.service";

export const validateFeedback =
async (
  requirement: string,
  feedback: string
) => {

  const prompt = `
You are an Enterprise Requirements Reviewer.

Requirement:
${requirement}

Feedback:
${feedback}

Accept feedback ONLY if it directly relates to:

- functionality
- workflow
- business rules
- integrations
- security
- compliance
- data requirements

Reject feedback if it is:

- personal comments
- emotions
- jokes
- random requests
- unrelated features

Examples:

Requirement:
Vendor Onboarding

Feedback:
Add Vendor KYC

Result:
{
  "valid": true,
  "reason": ""
}

Requirement:
Vendor Onboarding

Feedback:
I am feeling sleepy

Result:
{
  "valid": false,
  "reason": "Unrelated personal comment"
}

Requirement:
Vendor Onboarding

Feedback:
Add a cat feature

Result:
{
  "valid": false,
  "reason": "Feature unrelated to vendor onboarding"
}

Return ONLY JSON.

{
  "valid": true,
  "reason": ""
}
`;

  const result =
    await generateCompletion(
      prompt,
      0
    );

  try {

    return JSON.parse(
      result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );

  } catch {

    return {
      valid: false,
      reason:
        "Failed to validate feedback"
    };
  }
};