import { buildAiGovernanceAssetDistributionReadiness } from './aiGovernanceAssetDistributionReadiness.mjs';
import { buildAiGovernanceDistributionAssetFiles } from './aiGovernanceAssetDistributionFiles.mjs';
import { buildAiGovernanceReportContext } from './aiGovernanceReportContext.mjs';
import { buildAiGovernanceMaturityScorecard } from './aiGovernanceMaturityScorecard.mjs';
import { buildAiGovernanceFailureGroups } from './aiGovernanceReportFailures.mjs';
export const buildAiGovernanceReport = (rootDir) => {
  const context = buildAiGovernanceReportContext(rootDir);
  const failureGroups = buildAiGovernanceFailureGroups(rootDir, context);
  const distributionReadiness = buildAiGovernanceAssetDistributionReadiness({
    rootDir,
    assetFiles: buildAiGovernanceDistributionAssetFiles({
      rootDir, requiredFiles: context.requiredFiles, referenceRules: context.referenceRules,
    }),
  });
  return {
    requiredFiles: context.requiredFiles,
    referenceRules: context.referenceRules,
    evolutionEvalReport: context.evolutionEvalReport,
    distributionReadiness,
    ...failureGroups,
    maturityScorecard: buildAiGovernanceMaturityScorecard({ governanceReport: { ...failureGroups, ...context, distributionReadiness } }),
  };
};
