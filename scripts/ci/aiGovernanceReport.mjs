import { buildAiGovernanceReportContext } from './aiGovernanceReportContext.mjs';
import {
  collectAiGovernanceMissingFileFailures,
  collectAiGovernanceReferenceFailures,
  collectAiGovernanceSkillContractFailures,
} from './aiGovernanceReportFailures.mjs';

export const buildAiGovernanceReport = (rootDir) => {
  const context = buildAiGovernanceReportContext(rootDir);

  return {
    requiredFiles: context.requiredFiles,
    referenceRules: context.referenceRules,
    missingFiles: collectAiGovernanceMissingFileFailures(rootDir, context),
    skillContractFailures: collectAiGovernanceSkillContractFailures(rootDir, context),
    missingReferences: collectAiGovernanceReferenceFailures(rootDir, context),
  };
};
