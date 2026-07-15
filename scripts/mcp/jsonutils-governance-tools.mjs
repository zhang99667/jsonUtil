import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildJsonutilsGovernanceContext } from './jsonutils-governance-context.mjs';
import { buildJsonutilsAssetInventory } from './jsonutils-governance-assets.mjs';
import { buildJsonutilsDecisionSummary } from './jsonutils-governance-decisions.mjs';
import { buildJsonutilsEvaluationSummary } from './jsonutils-governance-evaluations.mjs';
import { buildJsonutilsHandoffBrief } from './jsonutils-governance-handoff.mjs';
import { buildJsonutilsGovernanceReportToolPayload } from './jsonutils-governance-report-tool.mjs';
import { buildJsonutilsGovernanceScorecardToolPayload } from './jsonutils-governance-scorecard-tool.mjs';
import {
  artifactFreshnessTool,
  assetInventoryTool,
  budgetReportTool,
  decisionSummaryTool,
  evaluationSummaryTool,
  governanceContextTool,
  governanceReportTool,
  governanceScorecardTool,
  handoffBriefTool,
  jsonutilsGovernanceTools,
  validationPlanTool,
  worktreeSnapshotTool,
} from './jsonutils-governance-tool-definitions.mjs';
import { buildJsonutilsValidationPlan } from './jsonutils-governance-validation-plan.mjs';
import { buildJsonutilsWorktreeSnapshot } from './jsonutils-governance-worktree.mjs';
import { assertJsonutilsGovernanceToolInput } from './jsonutils-governance-tool-input.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const normalizeTop = (value, max = 50, fallback = 10) => Math.min(max, Math.max(1, Number.isInteger(value) ? value : fallback));

const runNodeScript = (script, args = []) => new Promise((resolve) => {
  execFile(process.execPath, [script, ...args], {
    cwd: rootDir,
    maxBuffer: 1024 * 1024 * 20,
    timeout: 30000,
  }, (error, stdout, stderr) => {
    resolve({ exitCode: Number.isInteger(error?.code) ? error.code : (error ? 1 : 0), stdout, stderr });
  });
});
const jsonResult = (payload, isError) => ({ content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], structuredContent: payload, isError });
const scriptResult = (result) => {
  const response = { content: [{ type: 'text', text: [result.stdout, result.stderr].filter(Boolean).join('\n').trim() }], isError: result.exitCode !== 0 };
  try {
    const structuredContent = JSON.parse(result.stdout);
    return structuredContent && typeof structuredContent === 'object' && !Array.isArray(structuredContent) ? { ...response, structuredContent } : response;
  } catch { return response; }
};
export const listJsonutilsGovernanceTools = () => ({ tools: jsonutilsGovernanceTools });

export const callJsonutilsGovernanceTool = async (name, args = {}, runScript = runNodeScript) => {
  assertJsonutilsGovernanceToolInput(name, args);
  if (name === governanceContextTool.name) {
    const context = await buildJsonutilsGovernanceContext({ top: normalizeTop(args.top, 20, 5), runScript });
    return jsonResult(context, !context.ok);
  }
  if (name === governanceScorecardTool.name) {
    const payload = await buildJsonutilsGovernanceScorecardToolPayload({ top: normalizeTop(args.top, 50, 35), runScript });
    return jsonResult(payload.scorecard, !payload.ok);
  }
  if (name === artifactFreshnessTool.name) {
    return scriptResult(await runScript('scripts/ci/write-ai-governance-artifacts.mjs', ['--check', '--json']));
  }
  if (name === assetInventoryTool.name) {
    const inventory = buildJsonutilsAssetInventory({ limit: normalizeTop(args.limit, 100, 20) });
    return jsonResult(inventory, !inventory.ok);
  }
  if (name === evaluationSummaryTool.name) {
    const summary = buildJsonutilsEvaluationSummary({ limit: normalizeTop(args.limit, 50, 10) });
    return jsonResult(summary, !summary.ok);
  }
  if (name === worktreeSnapshotTool.name) {
    const snapshot = await buildJsonutilsWorktreeSnapshot({ maxFiles: normalizeTop(args.maxFiles, 200, 50) });
    return jsonResult(snapshot, !snapshot.ok);
  }
  if (name === handoffBriefTool.name) {
    const brief = await buildJsonutilsHandoffBrief({ top: normalizeTop(args.top, 20, 5), maxFiles: normalizeTop(args.maxFiles, 100, 20), runScript });
    return jsonResult(brief, !brief.ok);
  }
  if (name === decisionSummaryTool.name) {
    const summary = buildJsonutilsDecisionSummary({ limit: normalizeTop(args.limit, 20, 5) });
    return jsonResult(summary, !summary.ok);
  }
  if (name === validationPlanTool.name) {
    const plan = await buildJsonutilsValidationPlan({ maxFiles: normalizeTop(args.maxFiles, 200, 50) });
    return jsonResult(plan, !plan.ok);
  }
  if (name === governanceReportTool.name) {
    const payload = await buildJsonutilsGovernanceReportToolPayload({ top: normalizeTop(args.top, 50, 35), runScript });
    return jsonResult(payload.report, !payload.ok);
  }
  const commandArgs = name === budgetReportTool.name
    ? ['--json', '--no-all', '--top', String(normalizeTop(args.top))]
    : ['--json'];
  const script = name === budgetReportTool.name
    ? 'scripts/ci/check-maintainability-budgets.mjs'
    : null;
  if (!script) throw new Error(`Unknown tool: ${name}`);
  return scriptResult(await runScript(script, commandArgs));
};
