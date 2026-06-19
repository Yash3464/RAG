import {ChunkModel} from "../models/Chunk";
import {generateEmbedding} from "./embedding.service";


export const indexJournalEntry =
async (
  journalId: string,
  content: string,
  metadata: any = {}
) => {
  // Clear any existing indexed chunks for this journal entry draft
  await ChunkModel.deleteMany({ documentId: journalId });

  const embedding =
    await generateEmbedding(
      content
    );

  return ChunkModel.create({
    documentId: journalId,
    chunkText: content,
    pageNumber: 1,
    embedding,
    metadata
  });
};