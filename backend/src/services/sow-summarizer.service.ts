import { generateCompletion } from "./llm.service";

/**
 * Generates a high-quality executive summary of the given SOW contract text.
 */
export const summarizeSOW = async (rawText: string): Promise<string> => {
  const cleanText = rawText.length > 8000
    ? rawText.substring(0, 8000) + "\n...[TRUNCATED FOR SUMMARY GENERATION]..."
    : rawText;

  const prompt = `
You are a Principal Product Manager and Technical Contract Auditor.

Provide a comprehensive, high-quality executive summary of the following Statement of Work (SOW) document.
The summary should highlight:
1. Executive Summary & Goals
2. Key Deliverables & Scope of Work
3. Timeline & Major Milestones
4. Major Assumptions, Constraints & Exclusions

SOW DOCUMENT TEXT:
${cleanText}

CRITICAL RULES:
- Write in a highly professional, clear, and structured layout.
- Use bullet points and bold titles.
- DO NOT mention document length or truncation.
- Output the clean markdown summary directly. Do not wrap it in markdown code blocks.
`;

  const response = await generateCompletion(prompt, 0.3);
  return response.trim();
};
