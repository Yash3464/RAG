export const dependencyAgent =
async (
  requirementId: string
) => {

  return {
    impactedModules: [],
    impactedApis: [],
    impactedTables: []
  };
};