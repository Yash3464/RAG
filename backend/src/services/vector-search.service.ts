import {
  ChunkModel
} from "../models/Chunk";

import {
  generateEmbedding
} from "./embedding.service";

const cosineSimilarity = (
  a: number[],
  b: number[]
): number => {

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return (
    dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )
  );
};

export const vectorSearch =
async (
  query: string,
  limit: number = 10
) => {

  const queryEmbedding =
    await generateEmbedding(
      query
    );

  const chunks =
    await ChunkModel.find({});

  const scoredChunks =
    chunks.map(
      (chunk: any) => ({
        chunk,
        score:
          cosineSimilarity(
            queryEmbedding,
            chunk.embedding || []
          )
      })
    );

  scoredChunks.sort(
    (a, b) =>
      b.score - a.score
  );

  return scoredChunks.slice(
    0,
    limit
  );
};