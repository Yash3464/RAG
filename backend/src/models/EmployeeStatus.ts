import mongoose from "mongoose";

const employeeStatusSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "afk", "inactive"],
      required: true,
    },
    isWorking: {
      type: Boolean,
      required: true,
    },
    currentTask: {
      type: String,
      default: "",
    },
    secondsElapsed: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update lastUpdated timestamp on save
employeeStatusSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

export const EmployeeStatusModel = mongoose.model(
  "EmployeeStatus",
  employeeStatusSchema
);
