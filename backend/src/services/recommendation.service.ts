import { generateCompletion } from "./llm.service";

export const generateRecommendations = async (content: string) => {
  const prompt = `
You are an elite cross-functional product leadership team consisting of:
- Principal Product Manager
- Lead Solution Architect
- Director of Quality Assurance
- Principal Security Engineer
- Compliance & Legal Officer
- Operations Manager

Analyze this requirement or business input:
"${content}"

Generate recommendations, challenge assumptions, and identify critical gaps.
Think deeply about edge cases, compliance (GDPR, SOC2, HIPAA, KYC), security, scalability, and operational workflows.

Return the response ONLY as a JSON object of this structure. Do not include markdown code block formatting or any text outside the JSON:
{
  "assumptions": [
    { "assumption": "Assumption to challenge", "challenge": "Why it should be challenged / alternative approach" }
  ],
  "blindSpots": [
    { "spot": "Blind spot identified", "solution": "How to address it in the design" }
  ],
  "edgeCases": [
    { "case": "Edge case / failure mode", "handling": "How the system should gracefully handle it" }
  ],
  "improvements": [
    { "improvement": "Suggested enhancement", "benefit": "Expected business or technical value" }
  ],
  "security": [
    { "concern": "Security concern / threat vector", "mitigation": "Mitigation strategy" }
  ],
  "compliance": [
    { "rule": "Compliance or regulatory concern", "action": "Required action" }
  ],
  "scalability": [
    { "bottleneck": "Scalability or performance bottleneck", "solution": "Architectural solution" }
  ]
}
`;

  const result = await generateCompletion(prompt, 0.3);
  
  // Clean potential JSON markdown wrapping
  const cleanedResult = result
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error("JSON parsing error in recommendations:", error, "Cleaned Output:", cleanedResult);
    // Return structured default if AI response was malformed
    return {
      assumptions: [{ assumption: "Implicit assumption of success", challenge: "Verify requirements details thoroughly." }],
      blindSpots: [{ spot: "Missing formal constraints", solution: "Define input validation, timeouts and limits." }],
      edgeCases: [{ case: "Empty or null payloads", handling: "Provide validation checks on API endpoints." }],
      improvements: [{ improvement: "Add comprehensive audits", benefit: "Enables trace logs for audit compliance." }],
      security: [{ concern: "Unauthenticated access", mitigation: "Enforce JWT authentication and role checks." }],
      compliance: [{ rule: "Data residency rules", action: "Verify database geographic storage." }],
      scalability: [{ bottleneck: "Database concurrency", solution: "Add connection pooling and indexes." }]
    };
  }
};
