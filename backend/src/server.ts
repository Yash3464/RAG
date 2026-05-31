import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import uploadRoutes from "./routes/upload.route";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

app.use("/api", uploadRoutes);

app.get("/test", (req, res) => {
  res.json({ success: true, message: "Test route working" });
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "Project Memory AI Backend Running" });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server Startup Error:", error);
    process.exit(1);
  }
};

startServer();
