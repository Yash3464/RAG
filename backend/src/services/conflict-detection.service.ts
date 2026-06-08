export const detectConflicts = (
  analysis: any
) => {

  return {
    conflicts:
      analysis.conflicts || [],

    hasConflicts:
      (analysis.conflicts || []).length > 0
  };
};