import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildJsonutilsGovernanceContextFromReports as buildContextFromReports } from './jsonutils-governance-context-builder.mjs';

const DEFAULT_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const runNodeScript = (script, args = [], cwd = DEFAULT_ROOT_DIR) => new Promise((resolve) => {
  execFile(process.execPath, [script, ...args], { cwd, maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
    resolve({ exitCode: error?.code ?? 0, stdout, stderr });
  });
});

const parseJsonOutput = (result, script) => {
  try {
    return JSON.parse(result.stdout);
  } catch {
    return { ok: false, parseError: `无法解析 ${script} 的 JSON 输出`, stdout: result.stdout, stderr: result.stderr };
  }
};

export const buildJsonutilsGovernanceContextFromReports = (options = {}) => buildContextFromReports({
  rootDir: DEFAULT_ROOT_DIR,
  ...options,
});

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
