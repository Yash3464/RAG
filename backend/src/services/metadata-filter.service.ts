import {JournalEntryModel} from "../models/JournalEntry";

export interface MetadataFilters {
  classification?: string;
  priority?: string;
  domain?: string;
  module?: string;
  status?: string;
  tags?: string[];
}

export const filterByMetadata =
async (
  filters: MetadataFilters
) => {
  const query: any = {};

  if (filters.classification) {
    query.classification =
      filters.classification;
  }

  if (filters.priority) {
    query.priority =
      filters.priority;
  }

  if (filters.domain) {
    query.domain =
      filters.domain;
  }

  if (filters.module) {
    query.module =
      filters.module;
  }

  if (filters.status) {
    query.status =
      filters.status;
  }

  if (
    filters.tags &&
    filters.tags.length > 0
  ) {
    query.tags = {
      $in: filters.tags
    };
  }

  return JournalEntryModel.find(
    query
  );
};