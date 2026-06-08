import {
  analyzeRequirement
} from "./requirement-analyzer.service";

import {
  hybridSearch
} from "./hybrid-search.service";

import {
  validateFeedback
} from "./feedback-validation.service";

export const refineRequirement =
async (
  originalRequirement: string,
  userFeedback: string
) => {

  const validation =
    await validateFeedback(
      originalRequirement,
      userFeedback
    );

  if (!validation.valid) {
    throw new Error(
      validation.reason
    );
  }

  const context =
    await hybridSearch(
      originalRequirement
    );

  const enhancedRequirement = `
Original Requirement:
${originalRequirement}

User Feedback:
${userFeedback}

Update the requirement based on the feedback.
`;

  return analyzeRequirement(
    enhancedRequirement,
    context
  );
};