import { buildAiGovernanceReportContext } from './aiGovernanceReportContext.mjs';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';
import { buildAiGovernanceFailureGroups } from './aiGovernanceReportFailures.mjs';
export const buildAiGovernanceReport = (rootDir) => {
  const context = buildAiGovernanceReportContext(rootDir);
  const failureGroups = buildAiGovernanceFailureGroups(rootDir, context);
  return {
    requiredFiles: context.requiredFiles,
    referenceRules: context.referenceRules,
    ...failureGroups,
    maturityScorecard: buildAiGovernanceMaturityScorecard({ governanceReport: { ...failureGroups, ...context } }),
  };
};
