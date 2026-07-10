import { buildAiGovernanceMaturityScorecard } from '../ci/aiGovernanceMaturityScorecard.mjs';

const compactFailureCounts = report => Object.fromEntries(
  Object.entries(report.failures || {}).map(([key, failures]) => [key, Array.isArray(failures) ? failures.length : 0])
);

const budgetHotspots = (budgetReport, top) => (budgetReport.items?.highUsage || [])
  .slice(0, top)
  .map(({ file, lineCount, maxLines, remainingLines, usageRatio }) => ({
    file,
    lineCount,
    maxLines,
    remainingLines,
    usageRatio,
  }));

const buildNextCommands = (governanceReport, budgetReport) => [
  ...(!governanceReport.ok ? ['node scripts/ci/check-ai-governance.mjs'] : []),
  ...(!budgetReport.ok ? ['node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all'] : []),
  'node --test scripts/mcp/*.test.mjs',
  'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all',
  'node scripts/ci/check-version-consistency.mjs',
].filter((command, index, commands) => commands.indexOf(command) === index);

export const buildJsonutilsGovernanceReportSummary = ({ governanceReport, budgetReport, top }) => ({
  governance: {
    ok: governanceReport.ok === true,
    counts: governanceReport.counts || {},
    failureCounts: compactFailureCounts(governanceReport),
  },
  maintainability: {
    ok: budgetReport.ok === true,
    counts: budgetReport.counts || {},
    highUsage: budgetHotspots(budgetReport, top),
  },
  maturityScorecard: buildAiGovernanceMaturityScorecard({ governanceReport, budgetReport }),
  nextCommands: buildNextCommands(governanceReport, budgetReport),
});
