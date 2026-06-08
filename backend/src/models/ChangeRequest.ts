import mongoose from "mongoose";

const changeRequestSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      description: String,

      status: {
        type: String,
        default: "pending"
      }
    },
    {
      timestamps: true
    }
  );

export const ChangeRequestModel =
  mongoose.model(
    "ChangeRequest",
    changeRequestSchema
  );