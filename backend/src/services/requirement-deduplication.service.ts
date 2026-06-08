import {
  generateCompletion
} from "./llm.service";

import {
  hybridSearch
} from "./hybrid-search.service";

export const checkDuplicateRequirement =
async (
  content: string
) => {

  const candidates =
    await hybridSearch(
      content
    );

  const topMatches =
    candidates.slice(
      0,
      3
    );

  for (
    const candidate
    of topMatches
  ) {

    const existing =
      candidate.document
        ?.chunkText ||
      "";

    const prompt = `
Compare requirements.

A:
${content}

B:
${existing}

Return ONLY JSON.

{
 "duplicate":true,
 "similarity":95,
 "reason":""
}
`;

    const result =
      await generateCompletion(
        prompt,
        0
      );

    const analysis =
      JSON.parse(
        result
          .replace(/```json/g,"")
          .replace(/```/g,"")
          .trim()
      );

    if (
      analysis.duplicate &&
      analysis.similarity >= 85
    ) {

      return {
        duplicate: true,

        similarity:
          analysis.similarity,

        reason:
          analysis.reason,

        existing: {

          id:
            candidate.document
              ?._id,

          content:
            existing,

          classification:
            candidate.document
              ?.metadata
              ?.classification,

          priority:
            candidate.document
              ?.metadata
              ?.priority
        }
      };
    }
  }

  return {
    duplicate: false
  };
};