import { Request, Response } from "express";

import { DocumentModel } from "../models/Document";
import { ChunkModel } from "../models/Chunk";

import { extractPdfText } from "../services/pdf.service";
import { chunkText } from "../services/chunking.service";
import {generateEmbedding} from "../services/embedding.service";

export const uploadDocument = async (
  req: Request,
  res: Response
) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const file = req.file as Express.Multer.File;

    const document =
      await DocumentModel.create({
        title: file.originalname,
        sourceType: "pdf"
      });

    const text =
      await extractPdfText(file.buffer);

    const chunks =
      chunkText(text);

    const chunkDocs = [];

for (
  let index = 0;
  index < chunks.length;
  index++
) {

  const chunk = chunks[index];

  console.log(
    `Embedding Chunk ${
      index + 1
    }/${chunks.length}`
  );

  const embedding =
    await generateEmbedding(
      chunk
    );

  chunkDocs.push({
    documentId:
      document._id,

    chunkText: chunk,

    pageNumber:
      index + 1,

    embedding,

    metadata: {
      source:
        file.originalname,

      uploadedAt:
        new Date()
    }
  });
}

await ChunkModel.insertMany(
  chunkDocs
);

    return res.json({
      success: true,

      documentId: document._id,

      chunksCreated:
        chunks.length
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Upload failed"
    });
  }
};
