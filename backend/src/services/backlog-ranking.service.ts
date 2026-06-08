import {
  JournalEntryModel
} from "../models/JournalEntry";

export const rankBacklog =
async () => {

  const entries =
    await JournalEntryModel.find({});

  return entries
    .map(
      (entry: any) => {

        const effort =
          (
            entry.estimatedDevelopmentHours || 0
          )
          +
          (
            entry.estimatedTestingHours || 0
          )
          +
          (
            entry.estimatedReviewHours || 0
          )
          +
          (
            entry.estimatedDocumentationHours || 0
          );

        const rankingScore =
          (
            entry.priorityScore || 0
          )
          -
          (
            effort * 0.2
          );

        return {
          ...entry.toObject(),
          rankingScore
        };
      }
    )
    .sort(
      (a: any, b: any) =>
        b.rankingScore -
        a.rankingScore
    );
};