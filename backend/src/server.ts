import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import askRoutes from "./routes/ask.route";

import { connectDB } from "./config/db";
import chatRoutes from "./routes/chat.route";
import uploadRoutes from "./routes/upload.route";
import searchRoutes from "./routes/search.route";

dotenv.config();

const app = express();

/*
  MIDDLEWARE
*/
app.use(cors());
app.use(express.json());
app.use("/api", chatRoutes);

app.use((req, res, next) => {
  console.log(
    "REQUEST:",
    req.method,
    req.url
  );

  next();
});
app.use(
  "/api",
  askRoutes
);

/*
  ROUTES
*/
app.use("/api", uploadRoutes);
app.use("/api", searchRoutes);

/*
  TEST ROUTE
*/
app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");

  res.json({
    success: true,
    message: "Test route working",
  });
});

/*
  ROOT ROUTE
*/
app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Project Memory AI Backend Running",
  });
});

const PORT =
  process.env.PORT || 5001;

/*
  START SERVER
*/
const startServer = async () => {
  try {
    await connectDB();

    console.log(
      "Starting Express..."
    );

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );

      console.log(
        `Test URL: http://localhost:${PORT}/test`
      );
    });

  } catch (error) {

    console.error(
      "Server Startup Error:",
      error
    );

    process.exit(1);
  }
};

startServer();