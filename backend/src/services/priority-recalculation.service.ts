import {
  classifyPriority
} from "./priority-classifier.service";

export const recalculatePriority =
async (
  content: string,
  classification: string
) => {

  return classifyPriority(
    content,
    classification
  );
};