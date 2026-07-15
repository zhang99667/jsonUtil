import {
  AI_GOVERNANCE_FAILURE_GROUPS,
  hasAiGovernanceFailures,
} from './aiGovernanceFailureGroupDescriptors.mjs';

const JSON_REPORT_SCHEMA_VERSION = 1;

export const toAiGovernanceJsonReport = report => ({
  schemaVersion: JSON_REPORT_SCHEMA_VERSION,
  reportType: 'ai-governance',
  ok: !hasAiGovernanceFailures(report),
  counts: {
    requiredFiles: report.requiredFiles.length,
    referenceRules: report.referenceRules.length,
    ...Object.fromEntries(AI_GOVERNANCE_FAILURE_GROUPS.map(([key]) => [key, report[key].length])),
  },
  failures: Object.fromEntries(AI_GOVERNANCE_FAILURE_GROUPS.map(([key]) => [key, report[key]])),
  evolutionEvals: report.evolutionEvalReport,
  maturityScorecard: report.maturityScorecard,
});

export const formatAiGovernanceJsonReport = report => `${JSON.stringify(toAiGovernanceJsonReport(report), null, 2)}\n`;
