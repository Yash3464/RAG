import { Request, Response } from "express";
import { extractPdfText } from "../services/pdf.service";
import { chunkText } from "../services/chunking.service";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const file = req.file as Express.Multer.File;
    const text = await extractPdfText(file.buffer);
    const chunks = chunkText(text);

    return res.json({ success: true, message: "Text chunked", chunksCount: chunks.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
