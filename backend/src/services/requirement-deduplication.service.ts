import {
  generateCompletion
} from "./llm.service";

import {
  hybridSearch
} from "./hybrid-search.service";

export const checkDuplicateRequirement =
async (
  content: string,
  excludeJournalId?: string
) => {

  const candidates =
    await hybridSearch(
      content
    );

  const topMatches =
    candidates.slice(
      0,
      1
    );

  const checkPromises = topMatches.map(async (candidate) => {
    const journalId = candidate.document?.documentId?.toString();
    if (excludeJournalId && journalId === excludeJournalId.toString()) {
      return null;
    }

    const classification = candidate.document?.metadata?.classification;
    if (!classification) {
      return null;
    }

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

    let analysis: any;
    try {
      const cleanText = result.replace(/```json/gi, "").replace(/```/g, "").trim();
      analysis = JSON.parse(cleanText);
    } catch (e) {
      try {
        const match = result.match(/\{[\s\S]*\}/);
        if (match) {
          analysis = JSON.parse(match[0]);
        } else {
          analysis = { duplicate: false, similarity: 0, reason: "" };
        }
      } catch (innerError) {
        analysis = { duplicate: false, similarity: 0, reason: "" };
      }
    }

    if (
      analysis.duplicate &&
      analysis.similarity >= 85
    ) {
      return {
        duplicate: true,
        similarity: analysis.similarity,
        reason: analysis.reason,
        existing: {
          id: candidate.document?._id,
          content: existing,
          classification: candidate.document?.metadata?.classification,
          priority: candidate.document?.metadata?.priority
        }
      };
    }

    return null;
  });

  const results = await Promise.all(checkPromises);
  const duplicateMatch = results.find((r) => r !== null && r.duplicate);
  if (duplicateMatch) {
    return duplicateMatch;
  }

  return {
    duplicate: false
  };
};