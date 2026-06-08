import {
  JournalEntryModel
} from "../models/JournalEntry";

import {
  TaskModel
} from "../models/Task";

export const getBacklog =
async () => {

  const entries =
    await JournalEntryModel.find({})
    .sort({
      priorityScore: -1
    });

  const tasks =
    await TaskModel.find({});

  const requirements =
    entries.filter(
      (e: any) =>
        e.classification ===
        "requirement"
    );

  const businessRules =
    entries.filter(
      (e: any) =>
        e.classification ===
        "business_rule"
    );

  const changeRequests =
    entries.filter(
      (e: any) =>
        e.classification ===
        "change_request"
    );

  const bugs =
    entries.filter(
      (e: any) =>
        e.classification ===
        "bug"
    );

  const issues =
    entries.filter(
      (e: any) =>
        e.classification ===
        "issue"
    );

  const blockedTasks =
    tasks.filter(
      (t: any) =>
        t.status === "blocked"
    );

  const pendingTasks =
    tasks.filter(
      (t: any) =>
        t.status === "pending"
    );

  const completedTasks =
    tasks.filter(
      (t: any) =>
        t.status === "completed"
    );

  const overdueTasks =
    tasks.filter(
      (t: any) =>
        t.dueDate &&
        new Date(t.dueDate) <
        new Date() &&
        t.status !== "completed"
    );

  const priorityRanking =
    [...entries]
    .sort(
      (a: any, b: any) =>
        (b.priorityScore || 0) -
        (a.priorityScore || 0)
    )
    .slice(0, 20);

  const recommendedTasks =
    pendingTasks
        .sort(
        (a: any, b: any) =>
            (b.priorityScore || 0) -
            (a.priorityScore || 0)
        )
        .slice(0, 5);

    const releaseCandidates =
    entries
        .filter(
        (e: any) =>
            e.priority === "critical" ||
            e.priority === "high"
        )
        .slice(0, 10);
    }