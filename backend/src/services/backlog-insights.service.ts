import {
  TaskModel
} from "../models/Task";

import {
  JournalEntryModel
} from "../models/JournalEntry";

export const getBacklogInsights =
async () => {

  const tasks =
    await TaskModel.find({});

  const journal =
    await JournalEntryModel.find({});

  return {

    totalTasks:
      tasks.length,

    pendingTasks:
      tasks.filter(
        t => t.status === "pending"
      ).length,

    blockedTasks:
      tasks.filter(
        t => t.status === "blocked"
      ).length,

    completedTasks:
      tasks.filter(
        t => t.status === "completed"
      ).length,

    requirements:
      journal.filter(
        j =>
          j.classification ===
          "requirement"
      ).length,

    bugs:
      journal.filter(
        j =>
          j.classification ===
          "bug"
      ).length,

    issues:
      journal.filter(
        j =>
          j.classification ===
          "issue"
      ).length
  };
};