import mongoose from "mongoose";

const employeeIssueSchema = new mongoose.Schema(
  {
    employeeEmail: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["bug", "issue"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeIssueModel = mongoose.model(
  "EmployeeIssue",
  employeeIssueSchema
);
