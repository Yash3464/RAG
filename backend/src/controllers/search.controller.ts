import { Request, Response } from "express";

import { ChunkModel } from "../models/Chunk";
import { generateEmbedding } from "../services/embedding.service";

export const searchChunks = async (
  req: Request,
  res: Response
) => {
  try {

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query required"
      });
    }

    const queryEmbedding =
      await generateEmbedding(query);

    const chunks =
      await ChunkModel.find();

    const scoredChunks =
      chunks.map((chunk: any) => {

        const similarity =
          cosineSimilarity(
            queryEmbedding,
            chunk.embedding
          );

        return {
          chunkText:
            chunk.chunkText,

          similarity
        };
      });

    scoredChunks.sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );

    return res.json({
      success: true,

      results:
        scoredChunks.slice(0, 5)
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false
    });
  }
};

function cosineSimilarity(
  a: number[],
  b: number[]
) {

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    dot += a[i] * b[i];

    magA += a[i] * a[i];

    magB += b[i] * b[i];
  }

  return (
    dot /
    (
      Math.sqrt(magA) *
      Math.sqrt(magB)
    )
  );
}
