import { generateCompletion } from "./llm.service";
import { FRDModel } from "../models/FRD";
import { JournalEntryModel } from "../models/JournalEntry";
import { TaskModel } from "../models/Task";

export const breakdownFRDTasks = async (frdId: string) => {
  const frd = await FRDModel.findById(frdId);
  if (!frd) {
    throw new Error("FRD document not found");
  }

  const prompt = `
You are a Senior Technical Project Manager.
Break down the following Functional Requirement Document (FRD) user stories and business rules into concrete engineering tasks for development.

FRD INTRODUCTION:
${frd.introduction}

USER STORIES:
${JSON.stringify(frd.userStories, null, 2)}

BUSINESS RULES:
${(frd.businessRules || []).join("\n")}

Format your response as a valid JSON object containing an array of tasks.

JSON SCHEMA:
{
  "tasks": [
    {
      "title": "Build database migration and schemas for Stripe onboarding",
      "description": "Create the VendorKyc collection, fields, relationships, and index definitions in Mongoose.",
      "classification": "task",
      "priority": "high", 
      "priorityScore": 75,
      "complexityScore": 3,
      "estimatedDevelopmentHours": 12,
      "estimatedTestingHours": 4,
      "acceptanceCriteria": [
        "Database collection exists with proper validation constraints.",
        "Indexes are defined for requirementCode."
      ]
    }
  ]
}

CRITICAL RULES:
- Return ONLY the raw JSON.
- DO NOT wrap in markdown \`\`\`json blocks.
- Output between 3 to 6 actionable tasks.
- Keep complexity score between 1 and 5.
- Priorities must be one of: "low", "medium", "high", "critical".
- Ensure the estimates are realistic based on standard web application development.
`;

  const responseText = await generateCompletion(prompt, 0.2);
  let cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanText);
    const createdTasks = [];

    for (const task of parsed.tasks || []) {
      // 1. Create Journal Entry (Release Board Card)
      const journalItem = await JournalEntryModel.create({
        content: `[Task] ${task.title}: ${task.description}`,
        sourceType: "manual",
        classification: "task",
        status: "approved", // Put directly on Release Planner columns
        priority: task.priority || "medium",
        priorityScore: task.priorityScore || 50,
        complexityScore: task.complexityScore || 3,
        estimatedDevelopmentHours: task.estimatedDevelopmentHours || 8,
        estimatedTestingHours: task.estimatedTestingHours || 4,
        estimatedReviewHours: Math.ceil((task.estimatedDevelopmentHours || 8) / 4),
        estimatedDocumentationHours: 2,
        estimatedComputeHours: 1,
        versions: [
          {
            versionNumber: 1,
            content: `[Task] ${task.title}: ${task.description}`,
            title: task.title.substring(0, 100),
            modifiedBy: "admin@brained.ai"
          }
        ]
      });

      // 2. Create detailed task card in TaskModel
      const createdTask = await TaskModel.create({
        journalId: journalItem._id,
        title: task.title,
        description: task.description,
        taskType: "task",
        priority: task.priority || "medium",
        priorityScore: task.priorityScore || 50,
        status: "pending",
        estimatedHours: (task.estimatedDevelopmentHours || 8) + (task.estimatedTestingHours || 4),
        aiGenerated: true,
        acceptanceCriteria: task.acceptanceCriteria || [],
        sourceId: frd.requirementMasterId.toString()
      });

      createdTasks.push(createdTask);
    }

    return createdTasks;
  } catch (error) {
    console.error("Task Breakdown failed to parse JSON:", error);
    // Fallback: Create 2 standard task items
    const fallbackTasks = [
      {
        title: `Setup base configurations for ${frd.introduction.substring(0, 40)}`,
        description: `Implement base configurations, API entrypoints, and routing layers.`,
        complexityScore: 2,
        estimatedDevelopmentHours: 8,
        estimatedTestingHours: 3
      },
      {
        title: `Verify edge case validations for ${frd.introduction.substring(0, 40)}`,
        description: `Create integration tests and functional tests for positive and negative paths.`,
        complexityScore: 3,
        estimatedDevelopmentHours: 6,
        estimatedTestingHours: 4
      }
    ];

    const createdTasks = [];
    for (const task of fallbackTasks) {
      const journalItem = await JournalEntryModel.create({
        content: `[Task] ${task.title}: ${task.description}`,
        sourceType: "manual",
        classification: "task",
        status: "approved",
        priority: "medium",
        priorityScore: 45,
        complexityScore: task.complexityScore,
        estimatedDevelopmentHours: task.estimatedDevelopmentHours,
        estimatedTestingHours: task.estimatedTestingHours,
        estimatedReviewHours: 2,
        estimatedDocumentationHours: 2,
        estimatedComputeHours: 1,
        versions: [
          {
            versionNumber: 1,
            content: `[Task] ${task.title}: ${task.description}`,
            title: task.title.substring(0, 100),
            modifiedBy: "admin@brained.ai"
          }
        ]
      });

      const createdTask = await TaskModel.create({
        journalId: journalItem._id,
        title: task.title,
        description: task.description,
        taskType: "task",
        priority: "medium",
        priorityScore: 45,
        status: "pending",
        estimatedHours: task.estimatedDevelopmentHours + task.estimatedTestingHours,
        aiGenerated: true,
        acceptanceCriteria: ["Configuration runs without error", "Test cases assert core bounds"],
        sourceId: frd.requirementMasterId.toString()
      });
      createdTasks.push(createdTask);
    }
    return createdTasks;
  }
};
