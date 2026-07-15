import fs from 'node:fs';
import path from 'node:path';

const RULES_FILE = '.codex/rules/default.rules';
const MAX_RULES_BYTES = 16 * 1024;

export const CODEX_PROJECT_COMMAND_RULES_CONTRACT = Object.freeze({
  caseId: 'codex-project-command-rules-boundary',
  version: '1.0.0',
});

export const CODEX_PROJECT_COMMAND_RULE_FILES = Object.freeze([RULES_FILE]);

export const AI_GOVERNANCE_CODEX_COMMAND_RULE_REQUIRED_FILES = Object.freeze([
  ...CODEX_PROJECT_COMMAND_RULE_FILES,
  'scripts/ci/aiGovernanceCodexCommandRules.mjs',
  'scripts/ci/aiGovernanceCodexCommandRuleCaseDescriptors.mjs',
  'scripts/ci/aiGovernanceCodexCommandRules.test.mjs',
  'scripts/ci/maintainability-budget-governance-ai-command-rule-contract-rules.mjs',
]);

export const CODEX_PROJECT_COMMAND_RULES = Object.freeze([
  {
    pattern: ['git', ['add', 'commit', 'push', 'reset', 'checkout', 'restore', 'clean']],
    decision: 'prompt',
    justification: 'Git writes or destructive operations require explicit maintainer approval; inspect git status and git diff first.',
    match: ["git add CHANGELOG.md", "git commit -m 'Chore: update AI infrastructure'", 'git push origin HEAD', 'git reset --hard HEAD', 'git checkout -- CHANGELOG.md', 'git restore CHANGELOG.md', 'git clean -fd'],
    notMatch: ['git status --short --branch', 'git diff --check', 'git log -1 --oneline'],
  },
  {
    pattern: ['node', 'scripts/ci/manage-project-plugins.mjs', ['--apply', '--write-lock']],
    decision: 'prompt',
    justification: 'Plugin lifecycle and content-lock updates require explicit maintainer approval; run --check first.',
    match: ['node scripts/ci/manage-project-plugins.mjs --apply', 'node scripts/ci/manage-project-plugins.mjs --write-lock'],
    notMatch: ['node scripts/ci/manage-project-plugins.mjs', 'node scripts/ci/manage-project-plugins.mjs --check', 'node scripts/ci/manage-project-plugins.mjs --help'],
  },
  {
    pattern: ['node', ['scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', 'scripts/ci/record-ai-evolution-paired-outcome.mjs', 'scripts/ci/write-ai-governance-artifacts.mjs']],
    decision: 'prompt',
    justification: 'These writer entrypoints can mutate governance ledgers or artifacts; review preview or check output before escalation.',
    match: ['node scripts/ci/record-ai-evolution-deterministic-outcomes.mjs --case mcp-readonly-shell-rejection --write', 'node scripts/ci/record-ai-evolution-deterministic-outcomes.mjs --case mcp-readonly-shell-rejection --json', 'node scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs --write --json', 'node scripts/ci/record-ai-evolution-paired-outcome.mjs --json --write', 'node scripts/ci/write-ai-governance-artifacts.mjs', 'node scripts/ci/write-ai-governance-artifacts.mjs --check'],
    notMatch: ['node scripts/ci/check-ai-evolution-evals.mjs', 'node scripts/ci/run-ai-evolution-cases.mjs --all --json'],
  },
  {
    pattern: ['node', 'scripts/ci/run-ai-validation-execution.mjs', '--run'],
    decision: 'prompt',
    justification: 'Validation execution starts the fixed command registry; inspect the zero-execution preview first.',
    match: ['node scripts/ci/run-ai-validation-execution.mjs --run', 'node scripts/ci/run-ai-validation-execution.mjs --run --json'],
    notMatch: ['node scripts/ci/run-ai-validation-execution.mjs', 'node scripts/ci/run-ai-validation-execution.mjs --json', 'node scripts/ci/run-ai-validation-execution.mjs --json --run'],
  },
  {
    pattern: ['node', 'scripts/ci/run-ai-validation-execution.mjs', '--json', '--run'],
    decision: 'prompt',
    justification: 'Validation --run requires approval regardless of valid flag order.',
    match: ['node scripts/ci/run-ai-validation-execution.mjs --json --run'],
    notMatch: ['node scripts/ci/run-ai-validation-execution.mjs --json'],
  },
  {
    pattern: [['bash', 'zsh', 'sh'], ['-lc', '-c']],
    decision: 'prompt',
    justification: 'Advanced shell syntax may become an opaque wrapper; review the entire wrapper before escalation.',
    match: ["bash -lc 'echo $HOME'", "zsh -c 'node scripts/ci/manage-project-plugins.mjs --apply > plugin.log'"],
    notMatch: ['bash --version', 'git status --short --branch'],
  },
]);

const starlarkValue = value => Array.isArray(value)
  ? `[${value.map(starlarkValue).join(', ')}]`
  : JSON.stringify(value);
const renderExamples = values => values.map(value => `        ${starlarkValue(value)},`).join('\n');
const renderRule = rule => [
  'prefix_rule(',
  `    pattern = ${starlarkValue(rule.pattern)},`,
  `    decision = ${starlarkValue(rule.decision)},`,
  `    justification = ${starlarkValue(rule.justification)},`,
  '    match = [', renderExamples(rule.match), '    ],',
  '    not_match = [', renderExamples(rule.notMatch), '    ],',
  ')',
].join('\n');

export const CANONICAL_CODEX_PROJECT_COMMAND_RULES = [
  '# JSONUtils project command policy.',
  '# Rules are experimental, trust-gated, and only apply to commands requested outside the sandbox.',
  '# They do not prove that Codex loaded this file or replace repository, sandbox, CI, or admin controls.',
  '',
  CODEX_PROJECT_COMMAND_RULES.map(renderRule).join('\n\n'),
  '',
].join('\n');

export const collectCodexCommandRuleFailures = (rootDir) => {
  const absolute = path.join(rootDir, RULES_FILE);
  try {
    const metadata = fs.lstatSync(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return [`${RULES_FILE}: 必须是普通文件且不能是 symlink`];
    if (metadata.size > MAX_RULES_BYTES) return [`${RULES_FILE}: 不能超过 ${MAX_RULES_BYTES} bytes`];
    return fs.readFileSync(absolute, 'utf8') === CANONICAL_CODEX_PROJECT_COMMAND_RULES
      ? []
      : [`${RULES_FILE}: 必须匹配已审计 canonical command policy`];
  } catch (error) {
    return [`${RULES_FILE}: 无法读取（${error.code ?? 'unknown'}）`];
  }
};
