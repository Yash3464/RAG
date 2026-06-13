import { generateCompletion } from "./llm.service";

export const mergeSOWContexts = async (
  originalContext: string,
  changes: any[]
) => {
  const cleanOriginal = originalContext.length > 5000 
    ? originalContext.substring(0, 5000) + "\n...[TRUNCATED TO PREVENT TOKEN LIMIT OVERFLOWS]..."
    : originalContext;

  const prompt = `
You are a Principal Product Manager and Technical Contract Auditor.

Take the original SOW "mainContext" and apply the following list of approved updates, additions, and deletions.
Generate the complete, clean, updated SOW document.

ORIGINAL MAIN CONTEXT:
${cleanOriginal}

APPROVED CHANGES TO APPLY:
${JSON.stringify(changes, null, 2)}

CRITICAL RULES:
- Output ONLY the raw, clean, updated SOW document text.
- Do not output any notes, comments, intro, or wrap in markdown blocks.
- Ensure all other unchanged sections of the original context are preserved exactly.
- Apply additions by inserting the new text in the appropriate sections.
- Apply modifications by replacing the originalText with the newText.
- Apply deletions by removing the originalText.
`;

  const responseText = await generateCompletion(prompt, 0.2);
  return responseText.trim();
};
