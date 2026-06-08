import mongoose from "mongoose";

const approvalSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      approved: {
        type: Boolean,
        default: false
      },

      remarks: String
    },
    {
      timestamps: true
    }
  );

export const ApprovalModel =
  mongoose.model(
    "Approval",
    approvalSchema
  );