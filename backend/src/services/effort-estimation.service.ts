export const estimateEffort = async (requirement: string) => {
  const prompt = `
Estimate the development complexity of the following software requirement on a scale of 1 to 5.
1 = Very Simple (minor text change, simple logic, minimal risk)
2 = Simple (small UI component, minor API update)
3 = Medium (standard feature, CRUD operations, moderate logic)
4 = High (complex workflow, multiple integration points, critical path)
5 = Very High (major architectural change, extensive data migrations, high risk)

Requirement:
"${requirement}"

Return ONLY JSON:
{
  "complexity": 3,
  "reason": "brief reason here"
}
`;

  let complexity = 3;
  try {
    const { generateCompletion } = require("./llm.service");
    const result = await generateCompletion(prompt, 0);
    const cleanText = result.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    complexity = Number(parsed.complexity) || 3;
    if (complexity < 1) complexity = 1;
    if (complexity > 5) complexity = 5;
  } catch (error) {
    console.error("Failed to dynamically estimate complexity, falling back to keyword heuristics:", error);
    // Fallback to keyword heuristics
    const text = requirement.toLowerCase();
    complexity = 3;
    if (text.includes("workflow") || text.includes("integration") || text.includes("architectural")) {
      complexity += 1;
    }
    if (text.includes("api") || text.includes("security")) {
      complexity += 1;
    }
    complexity = Math.min(complexity, 5);
  }

  return {
    developmentHours: Math.ceil(complexity * 3),
    testingHours: Math.ceil(complexity * 1.5),
    reviewHours: Math.ceil(complexity / 2),
    documentationHours: Math.ceil(complexity / 2),
    computeHours: complexity,
    complexity
  };
};