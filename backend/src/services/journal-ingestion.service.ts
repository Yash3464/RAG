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
        sourceType: "manual"
      });

    created.push(
      journal
    );
  }

  return created;
};