import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import askRoutes from "./routes/ask.route";
import requirementRoutes from "./routes/requirement.route";
import reviewRoutes from "./routes/review.route";
import { connectDB } from "./config/db";
import chatRoutes from "./routes/chat.route";
import uploadRoutes from "./routes/upload.route";
import searchRoutes from "./routes/search.route";
import impactRoutes from "./routes/impact.route";
import backlogRoutes from "./routes/backlog.route";
import bugRoutes from "./routes/bug.route";
import issueRoutes from "./routes/issue.route";
import taskRoutes from "./routes/task.route";
import releaseRoutes from "./routes/release.route";
import sourceRoutes from "./routes/source.route";
import recommendationRoutes from "./routes/recommendation.route";
import graphRoutes from "./routes/graph.route";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";


const app = express();

/*
  MIDDLEWARE
*/
app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/impact",impactRoutes);
app.use("/api", backlogRoutes);
app.use("/api", bugRoutes);
app.use("/api", issueRoutes);
app.use("/api", taskRoutes);
app.use("/api",releaseRoutes);
app.use("/api/sources",sourceRoutes);
app.use("/api", recommendationRoutes);
app.use("/api", graphRoutes);
app.use("/api", adminRoutes);

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
app.use("/api", requirementRoutes);
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