import {
  dependencyAgent
} from "./dependency-agent.service";

import {
  ruleAgent
} from "./rule-agent.service";

import {
  testcaseAgent
} from "./testcase-agent.service";

import {
  releaseAgent
} from "./release-agent.service";

export const runImpactAnalysis =
async (
  requirementId: string
) => {

  const dependency =
    await dependencyAgent(
      requirementId
    );

  const rules =
    await ruleAgent(
      requirementId
    );

  const tests =
    await testcaseAgent(
      requirementId
    );

  const releases =
    await releaseAgent(
      requirementId
    );

  return {
    dependency,
    rules,
    tests,
    releases
  };
};