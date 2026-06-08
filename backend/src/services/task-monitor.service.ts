import {
  TaskModel
} from "../models/Task";

export const getOverdueTasks =
async () => {

  const now =
    new Date();

  const tasks =
    await TaskModel.find({
      status: {
        $ne: "completed"
      },
      dueDate: {
        $lt: now
      }
    });

  return tasks.map(
    (task: any) => ({

      ...task.toObject(),

      overdueDays:
        Math.floor(
          (
            now.getTime() -
            task.dueDate.getTime()
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        )
    })
  );
};

export const getTaskAlerts =
async () => {

  const overdue =
    await getOverdueTasks();

  return {
    overdueCount:
      overdue.length,

    criticalOverdue:
      overdue.filter(
        (task: any) =>
          task.priority ===
          "critical"
      ),

    blockedTasks:
      await TaskModel.find({
        status: "blocked"
      })
  };
};