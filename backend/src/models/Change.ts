import mongoose from "mongoose";

const changeSchema = new mongoose.Schema(
  {
    oldChunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chunk",
    },

    newChunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chunk",
    },

    changeType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const ChangeModel = mongoose.model(
  "Change",
  changeSchema
);