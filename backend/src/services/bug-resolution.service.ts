import { generateCompletion } from "./llm.service";

export const analyzeBug = async (bugDescription: string) => {
  const prompt = `
You are a Lead Software Architect and Director of Quality Assurance.

Analyze this bug report:
"${bugDescription}"

Provide a detailed root cause analysis, severity assessment, step-by-step fix plan, estimated hours, and a set of high-quality, non-duplicate, and comprehensive test cases.
Make sure the test cases cover:
1. Positive Path: Validating correct behavior after the fix is applied.
2. Edge & Boundary Cases: Input extremes, empty states, or unexpected user actions.
3. Security & Validation: Input injection checks, rate limiting, and permission/auth checks if applicable.
4. Stress/Performance: Handlers for timeouts, database latency, or high concurrency.

Do NOT provide generic test cases like "Test login with valid credentials" or "Test login with invalid credentials".
Instead, provide highly specific test cases directly referencing the components, workflows, and inputs mentioned in the bug report.

Return ONLY a JSON object:
{
  "rootCause": "Detailed explanation of the likely root cause",
  "severity": "low|medium|high|critical",
  "fixPlan": ["Step 1...", "Step 2..."],
  "testCases": ["Detailed Test Case 1 with input, steps, and expected results...", "Detailed Test Case 2..."],
  "estimatedHours": 8
}
`;

  const result = await generateCompletion(prompt, 0.2);

  try {
    return JSON.parse(
      result
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()
    );
  } catch (error) {
    console.error("Bug analysis JSON parsing error:", error, "Raw output:", result);
    return {
      rootCause: "Insufficient system logs or parameters to isolate the root cause.",
      severity: "medium",
      fixPlan: ["Isolate the failing components.", "Inspect request headers and stack traces.", "Apply validation controls."],
      testCases: [
        "TC-01: Verify fix by reproducing original error inputs under normal conditions.",
        "TC-02: Boundary check: Submit empty, extreme length, and special character inputs.",
        "TC-03: Security check: Attempt unauthenticated requests and invalid API signatures."
      ],
      estimatedHours: 4
    };
  }
};