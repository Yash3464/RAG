import { Request, Response } from "express";
import { ChunkModel } from "../models/Chunk";
import { generateEmbedding } from "../services/embedding.service";
import { generateAnswer } from "../services/llm.service";

export const askQuestion = async (
  req: Request,
  res: Response
) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const queryEmbedding =
      await generateEmbedding(question);

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
          text: chunk.chunkText,
          similarity,
        };
      });

    scoredChunks.sort(
      (a, b) =>
        b.similarity - a.similarity
    );

    const context =
      scoredChunks
        .slice(0, 5)
        .map((c) => c.text)
        .join("\n\n");

    const answer =
      await generateAnswer(
        question,
        context
      );

    return res.json({
      success: true,
      answer,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate answer",
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

  for (let i = 0; i < a.length; i++) {
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
