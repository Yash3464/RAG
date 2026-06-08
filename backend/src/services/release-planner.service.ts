import { JournalEntryModel } from "../models/JournalEntry";
import { KnowledgeEdgeModel } from "../models/KnowledgeEdge";

export const planReleases = async () => {
  const items = await JournalEntryModel.find({});

  const release1: any[] = [];
  const release2: any[] = [];
  const release3: any[] = [];

  let totalDevelopmentHours = 0;
  let totalTestingHours = 0;
  let totalReviewHours = 0;
  let totalComputeHours = 0;

  for (const item of items as any[]) {
    // 1. Effort hours & penalty
    const effortHours =
      (item.estimatedDevelopmentHours || 0) +
      (item.estimatedTestingHours || 0) +
      (item.estimatedReviewHours || 0);

    const effortPenalty = Math.min(effortHours / 2, 30);

    // 2. Dependency count & penalty (depends_on other nodes or blocks other nodes)
    const dependencyCount = await KnowledgeEdgeModel.countDocuments({
      $or: [
        { sourceNodeId: item._id.toString(), relationshipType: "depends_on" },
        { targetNodeId: item._id.toString(), relationshipType: "blocks" }
      ]
    });

    const dependencyPenalty = Math.min(dependencyCount * 15, 45);

    // 3. Overall Release Score calculation
    const releaseScore = (item.priorityScore || 0) - effortPenalty - dependencyPenalty;

    totalDevelopmentHours += item.estimatedDevelopmentHours || 0;
    totalTestingHours += item.estimatedTestingHours || 0;
    totalReviewHours += item.estimatedReviewHours || 0;
    totalComputeHours += item.estimatedComputeHours || 0;

    const enrichedItem = {
      ...item.toObject(),
      releaseScore,
      dependencyCount,
      effortHours
    };

    if (releaseScore >= 60) {
      release1.push(enrichedItem);
    } else if (releaseScore >= 35) {
      release2.push(enrichedItem);
    } else {
      release3.push(enrichedItem);
    }
  }

  // Sort each release by score descending
  const sortByScore = (a: any, b: any) => b.releaseScore - a.releaseScore;
  release1.sort(sortByScore);
  release2.sort(sortByScore);
  release3.sort(sortByScore);

  return {
    release1,
    release2,
    release3,
    metrics: {
      totalDevelopmentHours,
      totalTestingHours,
      totalReviewHours,
      totalComputeHours,
      estimatedProjectHours: totalDevelopmentHours + totalTestingHours + totalReviewHours
    }
  };
};