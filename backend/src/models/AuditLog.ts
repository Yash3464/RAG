import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String, // "CREATE", "UPDATE", "DELETE"
      required: true,
    },
    targetId: {
      type: String, // nodeId / journalEntryId
      required: true,
    },
    targetType: {
      type: String, // "requirement", "task", etc.
      required: true,
    },
    details: {
      type: String, // text detailing the change
      required: true,
    },
    performedBy: {
      type: String, // email/user name of who performed the action
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
