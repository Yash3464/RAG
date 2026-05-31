import { Request, Response } from "express";

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    return res.json({ success: true, message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};
