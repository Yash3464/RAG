import mongoose from "mongoose";

const businessRuleSchema =
  new mongoose.Schema(
    {
      journalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JournalEntry"
      },

      rule: {
        type: String,
        required: true
      }
    },
    {
      timestamps: true
    }
  );

export const BusinessRuleModel =
  mongoose.model(
    "BusinessRule",
    businessRuleSchema
  );