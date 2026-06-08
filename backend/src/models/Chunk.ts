import mongoose from "mongoose";

const chunkSchema =
  new mongoose.Schema(
    {
      documentId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Document"
      },

      chunkText: {
        type: String,
        required: true
      },

      pageNumber: {
        type: Number,
        default: 1
      },

      embedding: {
        type: [Number],
        default: []
      },

      metadata: {
        type: Object,
        default: {}
      }
    },
    {
      timestamps: true
    }
  );

export const ChunkModel =
  mongoose.model(
    "Chunk",
    chunkSchema
  );