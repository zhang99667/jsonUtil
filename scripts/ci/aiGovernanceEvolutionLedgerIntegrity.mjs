import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const AI_EVOLUTION_LEDGER_PATHS = [
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
];

const nonEmptyLines = text => text.split(/\r?\n/).filter(line => line.trim().length > 0);

export const compareEvolutionLedgerPrefix = (baselineText, currentText) => {
  const baseline = nonEmptyLines(baselineText);
  const current = nonEmptyLines(currentText);
  const mismatchIndex = baseline.findIndex((line, index) => current[index] !== line);
  return {
    ok: mismatchIndex === -1,
    baselineLines: baseline.length,
    currentLines: current.length,
    appendedLines: Math.max(0, current.length - baseline.length),
    mismatchLine: mismatchIndex === -1 ? null : mismatchIndex + 1,
  };
};

export const resolveEvolutionLedgerBaseRef = (env = process.env) => {
  if (env.AI_GOVERNANCE_BASE_REF) return env.AI_GOVERNANCE_BASE_REF;
  if (env.GITHUB_BASE_REF) return `origin/${env.GITHUB_BASE_REF}`;
  return env.GITHUB_ACTIONS === 'true' ? 'HEAD^' : 'HEAD';
};

const readGitBaseline = ({ rootDir, baseRef, relativePath }) => {
  try {
    return {
      status: 'available',
      text: execFileSync('git', ['show', `${baseRef}:${relativePath}`], {
        cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }),
    };
  } catch {
    try {
      execFileSync('git', ['cat-file', '-e', `${baseRef}^{commit}`], { cwd: rootDir, stdio: 'ignore' });
      return { status: 'missing', reason: 'path-not-in-baseline' };
    } catch {
      return { status: 'unavailable', reason: 'git-baseline-unavailable' };
    }
  }
};

export const auditEvolutionLedgerIntegrity = ({
  rootDir,
  ledgerPaths = AI_EVOLUTION_LEDGER_PATHS,
  baseRef = resolveEvolutionLedgerBaseRef(),
  readBaseline = readGitBaseline,
} = {}) => {
  const failures = [];
  const files = ledgerPaths.map((ledgerPath) => {
    const relativePath = path.isAbsolute(ledgerPath) ? path.relative(rootDir, ledgerPath) : ledgerPath;
    const baseline = readBaseline({ rootDir, baseRef, relativePath });
    if (baseline.status !== 'available') return { path: relativePath, status: baseline.status, reason: baseline.reason };
    let currentText;
    try {
      currentText = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    } catch {
      failures.push(`ledger-integrity: \`${relativePath}\` 无法读取当前账本`);
      return { path: relativePath, status: 'fail' };
    }
    const comparison = compareEvolutionLedgerPrefix(baseline.text, currentText);
    if (!comparison.ok) failures.push(
      `ledger-integrity: \`${relativePath}\` 修改、删除或重排了 ${baseRef} 的第 ${comparison.mismatchLine} 条历史记录`
    );
    return { path: relativePath, status: comparison.ok ? 'pass' : 'fail', ...comparison };
  });
  const statuses = files.map(file => file.status);
  const status = failures.length > 0 ? 'fail'
    : statuses.includes('missing') ? 'unknown'
      : statuses.includes('unavailable') ? 'not-applicable' : 'pass';
  return { status, baseRef, files, failures };
};
