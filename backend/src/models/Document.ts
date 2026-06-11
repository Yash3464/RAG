import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["pdf", "email", "meeting"],
      required: true,
    },

    status: {
      type: String,
      default: "active",
    },

    summary: {
      type: String,
      default: "",
    },

    fullText: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel = mongoose.model(
  "Document",
  documentSchema
);