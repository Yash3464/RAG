import {
  JournalEntryModel
} from "../models/JournalEntry";

export const ingestEntries =
async (
  entries: string[],
  classification: string
) => {

  const created = [];

  for (
    const entry
    of entries
  ) {

    const journal =
      await JournalEntryModel.create({
        content: entry,
        classification,
        sourceType: "manual",
        versions: [
          {
            versionNumber: 1,
            content: entry,
            title: entry.substring(0, 100),
            modifiedBy: "system@brained.ai"
          }
        ]
      });

    created.push(
      journal
    );
  }

  return created;
};