#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildJsonutilsGovernanceContextFromReports } from '../mcp/jsonutils-governance-context.mjs';

const DEFAULT_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUT_DIR = 'artifacts/ai-governance';

const normalizeCount = (value, fallback) => (Number.isInteger(value) && value > 0 ? value : fallback);
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const runJsonReport = (rootDir, script, args) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  try {
    return { exitCode: result.status ?? 0, report: JSON.parse(result.stdout) };
  } catch {
    return {
      exitCode: result.status ?? 1,
      report: { ok: false, parseError: `无法解析 ${script} 的 JSON 输出`, stdout: result.stdout, stderr: result.stderr },
    };
  }
};

const buildSummary = context => [
  '### AI Governance',
  `- Project: ${context.project.name} ${context.project.version}`,
  `- Governance: ${context.governance.ok ? 'pass' : 'fail'}`,
  `- Maintainability: ${context.maintainability.ok ? 'pass' : 'fail'}`,
  `- Latest decision: ${context.project.latestDecision?.date ?? '-'} ${context.project.latestDecision?.decision ?? '-'}`,
  `- High usage: ${context.maintainability.highUsage.map(item => item.file).join(', ') || 'none'}`,
  '',
].join('\n');

export const writeAiGovernanceArtifacts = ({
  rootDir = DEFAULT_ROOT_DIR,
  outDir = DEFAULT_OUT_DIR,
  summaryFile = process.env.GITHUB_STEP_SUMMARY,
  top = 35,
  contextTop = 5,
  runReport = (script, args) => runJsonReport(rootDir, script, args),
} = {}) => {
  const outputDir = path.resolve(rootDir, outDir);
  const budgetTop = normalizeCount(top, 35);
  const contextLimit = normalizeCount(contextTop, 5);
  fs.mkdirSync(outputDir, { recursive: true });

  const governance = runReport('scripts/ci/check-ai-governance.mjs', ['--json']);
  const budget = runReport('scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', String(budgetTop)]);
  const context = buildJsonutilsGovernanceContextFromReports({
    rootDir,
    top: contextLimit,
    governanceReport: governance.report,
    budgetReport: budget.report,
  });

  const files = {
    governance: path.join(outputDir, 'ai-governance-report.json'),
    maintainability: path.join(outputDir, 'maintainability-budget-report.json'),
    context: path.join(outputDir, 'jsonutils-governance-context.json'),
    summary: path.join(outputDir, 'summary.md'),
  };
  const summary = buildSummary(context);
  writeJson(files.governance, governance.report);
  writeJson(files.maintainability, budget.report);
  writeJson(files.context, context);
  fs.writeFileSync(files.summary, summary);
  if (summaryFile) fs.appendFileSync(summaryFile, summary);

  return {
    ok: context.ok && governance.exitCode === 0 && budget.exitCode === 0,
    context,
    files,
    outputDir,
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = writeAiGovernanceArtifacts();
  console.log(`AI governance artifacts written to ${path.relative(process.cwd(), result.outputDir)}`);
  if (!result.ok) process.exitCode = 1;
}
