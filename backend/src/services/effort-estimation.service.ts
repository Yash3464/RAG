export const estimateEffort = async (requirement: string) => {
  const text = requirement.toLowerCase();
  let complexity = 3;

  if (text.includes("workflow")) {
    complexity += 2;
  }

  if (text.includes("approval")) {
    complexity += 1;
  }

  if (text.includes("api")) {
    complexity += 2;
  }

  if (text.includes("integration")) {
    complexity += 2;
  }

  if (text.includes("notification")) {
    complexity += 1;
  }

  complexity = Math.min(complexity, 10);

  return {
    developmentHours: Math.ceil(complexity * 3), // Reduced from complexity * 4
    testingHours: Math.ceil(complexity * 1.5), // Reduced from complexity * 2
    reviewHours: Math.ceil(complexity / 2),
    documentationHours: Math.ceil(complexity / 2),
    computeHours: complexity,
    complexity
  };
};