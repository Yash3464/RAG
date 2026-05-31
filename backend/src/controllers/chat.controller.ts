import { Request, Response } from "express";
import { ChunkModel } from "../models/Chunk";
import { generateEmbedding } from "../services/embedding.service";
import { generateAnswer } from "../services/llm.service";

export const chatWithDocument = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query required" });
    }

    const queryEmbedding = await generateEmbedding(query);
    const chunks = await ChunkModel.find();

    const scoredChunks = chunks.map((chunk: any) => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunkText: chunk.chunkText,
        similarity,
        pageNumber: chunk.pageNumber,
        source: chunk.metadata?.source || "Unknown Document",
      };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scoredChunks.slice(0, 5);

    const context = topChunks
      .map((chunk) => `Page: ${chunk.pageNumber}\nSource: ${chunk.source}\n\n${chunk.chunkText}`)
      .join("\n\n");

    const answer = await generateAnswer(query, context);

    return res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Chat failed" });
  }
};

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
