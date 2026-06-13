import { Request, Response } from "express";
import { SOWModel } from "../models/SOW";
import { SOWUpdateModel } from "../models/SOWUpdate";
import { compareSOWContexts } from "../services/sow-comparison.service";
import { mergeSOWContexts } from "../services/sow-merger.service";
import { parseContent } from "../services/file-parser.service";

// List all client SOW folders
export const getSOWsController = async (req: Request, res: Response) => {
  try {
    const sows = await SOWModel.find().sort({ updatedAt: -1 });
    return res.json({
      success: true,
      sows,
    });
  } catch (error) {
    console.error("Failed to list SOW documents:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list SOW documents",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Retrieve updates history timeline of a specific SOW
export const getSOWHistoryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sow = await SOWModel.findById(id);
    if (!sow) {
      return res.status(404).json({
        success: false,
        message: "SOW document not found",
      });
    }

    const updates = await SOWUpdateModel.find({ sowId: id }).sort({ versionNumber: -1 });
    return res.json({
      success: true,
      sow,
      updates,
    });
  } catch (error) {
    console.error("Failed to retrieve SOW history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve SOW history",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Ingest or update SOW file
export const uploadSOWController = async (req: Request, res: Response) => {
  try {
    let rawText = "";
    let sowTitle = "";
    const clientName = req.body.clientName || "Client";

    if (req.file) {
      sowTitle = req.file.originalname;
      rawText = await parseContent(req.file.buffer, sowTitle);
    } else if (req.body.content) {
      sowTitle = req.body.title || "Untitled SOW";
      rawText = req.body.content;
    } else {
      return res.status(400).json({
        success: false,
        message: "No SOW PDF file or text content provided",
      });
    }

    if (!rawText || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Extracted content is empty",
      });
    }

    // Check if an SOW with the same title and client exists
    const existingSOW = await SOWModel.findOne({ title: sowTitle, clientName });

    if (!existingSOW) {
      // 1. First upload: create SOW main context
      const newSOW = await SOWModel.create({
        title: sowTitle,
        clientName,
        mainContext: rawText,
        currentVersion: 1,
      });

      // 2. Log version 1 update
      await SOWUpdateModel.create({
        sowId: newSOW._id,
        versionNumber: 1,
        rawText,
        isMerged: true,
        changesExtracted: [
          {
            changeType: "addition",
            section: "Baseline",
            description: "Initial client Statement of Work uploaded.",
            newText: rawText,
          },
        ],
      });

      return res.json({
        success: true,
        isUpdate: false,
        message: "Successfully created new SOW document V1.",
        sow: newSOW,
      });
    } else {
      // 2. Re-upload: detect changes & trigger comparison
      const nextVersion = existingSOW.currentVersion + 1;
      const changes = await compareSOWContexts(existingSOW.mainContext, rawText);

      const sowUpdate = await SOWUpdateModel.create({
        sowId: existingSOW._id,
        versionNumber: nextVersion,
        rawText,
        isMerged: false,
        changesExtracted: changes,
      });

      return res.json({
        success: true,
        isUpdate: true,
        message: `Detected changes. SOW Update V${nextVersion} created as draft.`,
        sow: existingSOW,
        update: sowUpdate,
        changes,
      });
    }
  } catch (error) {
    console.error("Failed to ingest SOW document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to ingest SOW document",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Merge approved update into main context
export const mergeSOWUpdateController = async (req: Request, res: Response) => {
  try {
    const { updateId } = req.params;
    const updateDoc = await SOWUpdateModel.findById(updateId);
    if (!updateDoc) {
      return res.status(404).json({
        success: false,
        message: "SOW update version not found",
      });
    }

    const sowDoc = await SOWModel.findById(updateDoc.sowId);
    if (!sowDoc) {
      return res.status(404).json({
        success: false,
        message: "Parent SOW document not found",
      });
    }

    if (updateDoc.isMerged) {
      return res.status(400).json({
        success: false,
        message: "This update version has already been merged into the main context",
      });
    }

    // Call merger LLM service
    const mergedContext = await mergeSOWContexts(
      sowDoc.mainContext,
      updateDoc.changesExtracted
    );

    sowDoc.mainContext = mergedContext;
    sowDoc.currentVersion = updateDoc.versionNumber;
    await sowDoc.save();

    updateDoc.isMerged = true;
    await updateDoc.save();

    return res.json({
      success: true,
      message: `Successfully merged revision updates. SOW bumped to V${sowDoc.currentVersion}.`,
      sow: sowDoc,
      update: updateDoc,
    });
  } catch (error) {
    console.error("Failed to merge SOW updates:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to merge SOW updates",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Delete SOW and all historical update logs
export const deleteSOWController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await SOWModel.findByIdAndDelete(id);
    await SOWUpdateModel.deleteMany({ sowId: id });

    return res.json({
      success: true,
      message: "SOW and history timeline deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete SOW document:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete SOW document",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
