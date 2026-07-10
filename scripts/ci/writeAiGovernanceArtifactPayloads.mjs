import path from 'node:path';
import { buildJsonutilsGovernanceContextFromReports } from '../mcp/jsonutils-governance-context.mjs';
import { buildAiGovernanceArtifactSummary } from './writeAiGovernanceArtifactSummary.mjs';

const normalizeCount = (value, fallback) => (Number.isInteger(value) && value > 0 ? value : fallback);
const buildGeneratedAt = (now) => {
  const value = now();
  return value instanceof Date ? value.toISOString() : String(value);
};

export const buildAiGovernanceArtifactPayloads = ({
  rootDir,
  outDir,
  top = 35,
  contextTop = 5,
  now = () => new Date(),
  runReport,
}) => {
  const outputDir = path.resolve(rootDir, outDir);
  const budgetTop = normalizeCount(top, 35);
  const contextLimit = normalizeCount(contextTop, 5);
  const governance = runReport('scripts/ci/check-ai-governance.mjs', ['--json']);
  const budget = runReport('scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', String(budgetTop)]);
  const context = buildJsonutilsGovernanceContextFromReports({
    rootDir,
    top: contextLimit,
    governanceReport: governance.report,
    budgetReport: budget.report,
  });
  const generatedAt = buildGeneratedAt(now);
  const files = {
    governance: path.join(outputDir, 'ai-governance-report.json'),
    maintainability: path.join(outputDir, 'maintainability-budget-report.json'),
    context: path.join(outputDir, 'jsonutils-governance-context.json'),
    scorecard: path.join(outputDir, 'ai-governance-scorecard.json'),
    summary: path.join(outputDir, 'summary.md'),
  };
  return {
    ok: context.ok && governance.exitCode === 0 && budget.exitCode === 0,
    context,
    generatedAt,
    files,
    outputDir,
    artifacts: {
      governance: governance.report,
      maintainability: budget.report,
      context: { generatedAt, ...context },
      scorecard: { generatedAt, ...context.maturityScorecard },
      summary: buildAiGovernanceArtifactSummary(context, { generatedAt }),
    },
  };
};
