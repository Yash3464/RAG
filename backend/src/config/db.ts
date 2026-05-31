import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI as string,
      {
        dbName: process.env.DB_NAME
      }
    );

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error);

    process.exit(1);
  }
};