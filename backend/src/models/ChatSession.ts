import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "New Refinement Chat",
    },
    journalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ChatSessionModel = mongoose.model("ChatSession", chatSessionSchema);
