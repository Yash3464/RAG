import mongoose from "mongoose";

const sowUpdateSchema = new mongoose.Schema(
  {
    sowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SOW",
      required: true,
    },
    uploadedBy: {
      type: String,
      default: "client",
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    isMerged: {
      type: Boolean,
      default: false,
    },
    oldContext: {
      type: String,
      default: "",
    },
    newContext: {
      type: String,
      default: "",
    },
    changesExtracted: [
      {
        changeType: {
          type: String,
          enum: ["addition", "modification", "deletion"],
          required: true,
        },
        section: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          required: true,
        },
        originalText: {
          type: String,
          default: "",
        },
        newText: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const SOWUpdateModel = mongoose.model("SOWUpdate", sowUpdateSchema);
