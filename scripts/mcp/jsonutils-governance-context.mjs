import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const JSON_CONTEXT_SCHEMA_VERSION = 1;

const runNodeScript = (script, args = [], cwd = DEFAULT_ROOT_DIR) => new Promise((resolve) => {
  execFile(process.execPath, [script, ...args], { cwd, maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
    resolve({ exitCode: error?.code ?? 0, stdout, stderr });
  });
});

const readJson = (rootDir, file) => JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8'));
const readText = (rootDir, file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const parseJsonOutput = (result, script) => {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { ok: false, parseError: `无法解析 ${script} 的 JSON 输出`, stdout: result.stdout, stderr: result.stderr };
  }
};

const firstMatchingLine = (text, pattern) => text.split('\n').find(line => pattern.test(line)) || '';
const extractTopChangelogTitle = text => firstMatchingLine(text, /^## v/).replace(/^##\s+/, '').trim();
const extractLatestDecision = (text) => {
  const row = firstMatchingLine(text, /^\|\s*\d{4}-\d{2}-\d{2}\s*\|/);
  const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
  return cells.length >= 2 ? { date: cells[0], decision: cells[1] } : null;
};

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

export const buildJsonutilsGovernanceContextFromReports = ({
  rootDir = DEFAULT_ROOT_DIR,
  top = 5,
  governanceReport,
  budgetReport,
}) => {
  const packageJson = readJson(rootDir, 'frontend/package.json');

  return {
    schemaVersion: JSON_CONTEXT_SCHEMA_VERSION,
    reportType: 'jsonutils-governance-context',
    ok: governanceReport.ok === true && budgetReport.ok === true,
    project: {
      name: packageJson.name,
      version: packageJson.version,
      changelog: extractTopChangelogTitle(readText(rootDir, 'CHANGELOG.md')),
      latestDecision: extractLatestDecision(readText(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md')),
    },
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
    nextCommands: buildNextCommands(governanceReport, budgetReport),
  };
};

export const buildJsonutilsGovernanceContext = async ({
  rootDir = DEFAULT_ROOT_DIR,
  top = 5,
  runScript = (script, args) => runNodeScript(script, args, rootDir),
} = {}) => {
  const [governanceResult, budgetResult] = await Promise.all([
    runScript('scripts/ci/check-ai-governance.mjs', ['--json']),
    runScript('scripts/ci/check-maintainability-budgets.mjs', ['--json', '--no-all', '--top', String(top)]),
  ]);
  return buildJsonutilsGovernanceContextFromReports({
    rootDir,
    top,
    governanceReport: parseJsonOutput(governanceResult, 'check-ai-governance'),
    budgetReport: parseJsonOutput(budgetResult, 'check-maintainability-budgets'),
  });
};
