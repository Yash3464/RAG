import {
  ChunkModel
} from "../models/Chunk";

export const bm25Search =
async (
  query: string
) => {

  const documents =
    await ChunkModel.find({});

  const searchTerms =
    query
      .toLowerCase()
      .split(" ")
      .filter(Boolean);

  const results =
    documents.map(
      (doc: any) => {

        const text =
          (
            doc.chunkText || ""
          ).toLowerCase();

        let score = 0;

        for (
          const term of searchTerms
        ) {

          if (
            text.includes(term)
          ) {
            score++;
          }
        }

        return {
          document: doc,
          score
        };
      }
    );

  return results
    .filter(
      r => r.score > 0
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 20);
};