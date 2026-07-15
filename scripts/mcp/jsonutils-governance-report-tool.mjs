import { buildJsonutilsGovernanceContextFromReports } from './jsonutils-governance-context.mjs';

const parseScriptJson = (result, script) => {
  try { return JSON.parse(result.stdout); } catch {
    return { ok: false, parseError: `无法解析 ${script} 的 JSON 输出`, stdout: result.stdout, stderr: result.stderr };
  }
};

export const buildJsonutilsGovernanceReportToolPayload = async ({ top = 35, runScript }) => {
  const [governanceResult, budgetResult] = await Promise.all([
    runScript('scripts/ci/check-ai-governance.mjs', ['--json']),
    runScript('scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', String(top)]),
  ]);
  const governanceReport = parseScriptJson(governanceResult, 'check-ai-governance');
  const budgetReport = parseScriptJson(budgetResult, 'check-maintainability-budgets');
  const context = buildJsonutilsGovernanceContextFromReports({ governanceReport, budgetReport, top });
  const ok = context.ok;
  return {
    ok,
    report: {
      ...governanceReport,
      ok,
      governance: context.governance,
      maintainability: context.maintainability,
      maturityScorecard: context.maturityScorecard,
      nextCommands: context.nextCommands,
    },
  };
};
