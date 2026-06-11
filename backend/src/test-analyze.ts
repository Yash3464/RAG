import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db";
import { classifyContent } from "./services/classification.service";
import { checkDuplicateRequirement } from "./services/requirement-deduplication.service";
import { classifyPriority } from "./services/priority-classifier.service";
import { estimateEffort } from "./services/effort-estimation.service";

const runTest = async () => {
  try {
    await connectDB();
    console.log("Connected to DB");

    const content = "i want to create a web page for deployment";
    console.log("Testing content:", content);

    console.log("\n1. Running classifyContent...");
    const classification = await classifyContent(content);
    console.log("Result:", classification);

    console.log("\n2. Running checkDuplicateRequirement...");
    const duplicate = await checkDuplicateRequirement(content);
    console.log("Result:", duplicate);

    console.log("\n3. Running classifyPriority...");
    const priority = await classifyPriority(content, classification.type);
    console.log("Result:", priority);

    console.log("\n4. Running estimateEffort...");
    const effort = await estimateEffort(content);
    console.log("Result:", effort);

    console.log("\nAll checks passed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\nTEST FAILED WITH ERROR:");
    console.error(error);
    process.exit(1);
  }
};

runTest();
