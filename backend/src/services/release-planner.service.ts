import { JournalEntryModel } from "../models/JournalEntry";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";

const enrichJournalEntry = async (item: any) => {
  const complexity = item.complexityScore || 3;
  const devHours = Math.ceil(complexity * 3); // reduced from complexity * 4
  const testHours = Math.ceil(complexity * 1.5); // reduced from complexity * 2
  const revHours = Math.ceil(complexity / 2);
  const docHours = Math.ceil(complexity / 2);

  const effortHours = devHours + testHours + revHours;
  const effortPenalty = Math.min(effortHours / 2, 30);

  const dependencyCount = await KnowledgeEdgeModel.countDocuments({
    $or: [
      { sourceNodeId: item._id.toString(), relationshipType: "depends_on" },
      { targetNodeId: item._id.toString(), relationshipType: "blocks" }
    ]
  });

  const dependencyPenalty = Math.min(dependencyCount * 15, 45);

  const score = item.priorityScore || 0;
  let priority = "low";
  if (score >= 75) {
    priority = "critical";
  } else if (score >= 60) {
    priority = "high";
  } else if (score >= 40) {
    priority = "medium";
  }

  const releaseScore = score - effortPenalty - dependencyPenalty;

  return {
    ...item.toObject(),
    priority, // dynamically aligned priority
    estimatedDevelopmentHours: devHours, // dynamically adjusted dev hours
    estimatedTestingHours: testHours, // dynamically adjusted test hours
    estimatedReviewHours: revHours,
    estimatedDocumentationHours: docHours,
    releaseScore,
    dependencyCount,
    effortHours
  };
};

export const planReleases = async () => {
  const items = await JournalEntryModel.find({ status: { $ne: "completed" } });
  const completedDb = await JournalEntryModel.find({ status: "completed" });

  const release1: any[] = [];
  const release2: any[] = [];
  const release3: any[] = [];

  let totalDevelopmentHours = 0;
  let totalTestingHours = 0;
  let totalReviewHours = 0;
  let totalComputeHours = 0;

  for (const item of items as any[]) {
    const enrichedItem = await enrichJournalEntry(item);
    totalDevelopmentHours += enrichedItem.estimatedDevelopmentHours;
    totalTestingHours += enrichedItem.estimatedTestingHours;
    totalReviewHours += enrichedItem.estimatedReviewHours;
    totalComputeHours += enrichedItem.estimatedComputeHours || 0;

    const targetRelease = enrichedItem.releaseOverride || (enrichedItem.releaseScore >= 50 ? "release1" : (enrichedItem.releaseScore >= 30 ? "release2" : "release3"));

    if (targetRelease === "release1") {
      release1.push(enrichedItem);
    } else if (targetRelease === "release2") {
      release2.push(enrichedItem);
    } else {
      release3.push(enrichedItem);
    }
  }

  const completed: any[] = [];
  for (const item of completedDb as any[]) {
    const enrichedItem = await enrichJournalEntry(item);
    completed.push(enrichedItem);
  }

  // Sort each release by priorityScore descending to maintain consistency with UI score displays
  const sortByPriorityScore = (a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0);
  release1.sort(sortByPriorityScore);
  release2.sort(sortByPriorityScore);
  release3.sort(sortByPriorityScore);
  completed.sort(sortByPriorityScore);

  return {
    release1,
    release2,
    release3,
    completed,
    metrics: {
      totalDevelopmentHours,
      totalTestingHours,
      totalReviewHours,
      totalComputeHours,
      estimatedProjectHours: totalDevelopmentHours + totalTestingHours + totalReviewHours
    }
  };
};