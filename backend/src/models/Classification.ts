import mongoose from "mongoose";

const classificationSchema = new mongoose.Schema(
  {
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chunk",
    },

    type: {
      type: String,
      enum: [
        "Requirement",
        "Discussion",
        "Change Request",
        "Approval",
      ],
    },

    confidence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ClassificationModel =
  mongoose.model(
    "Classification",
    classificationSchema
  );
