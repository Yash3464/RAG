import mongoose from "mongoose";

const sowSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    mainContext: { // Will store the Summary of the SOW
      type: String,
      required: true,
    },
    fullContext: { // Will store the Full raw text of SOW
      type: String,
      required: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

sowSchema.index({ projectName: 1, clientName: 1 }, { unique: true });

export const SOWModel = mongoose.model("SOW", sowSchema);
