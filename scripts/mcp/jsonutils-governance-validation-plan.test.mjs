import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildJsonutilsValidationPlan,
  buildJsonutilsValidationPlanFromWorktree,
} from './jsonutils-governance-validation-plan.mjs';

const statusBytes = (...records) => Buffer.from(`${records.join('\0')}\0`);

const fixedDomainPaths = [
  'README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'CLAUDE.md',
  'evals/ai-governance/cases.json', 'scripts/ci/local-ci.sh', '.cursorrules',
  '.github/PULL_REQUEST_TEMPLATE.md', '.github/copilot-instructions.md', '.agents/plugins/plugin-lock.json',
  'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json',
  'docker-compose.yml', 'docker-compose.local.yml', 'docker-compose.preview.yml', 'docs/CICD.md',
];

test('validation plan maps every fixed domain while keeping catch-all hygiene non-classifying', async () => {
  const paths = [
    ...fixedDomainPaths, 'scripts/mcp/jsonutils-governance-tools.mjs',
    'scripts/ci/aiGovernanceRequiredCheckFiles.mjs', 'frontend/nginx.conf', 'CHANGELOG.md', 'scratch.txt',
  ];
  const plan = await buildJsonutilsValidationPlan({
    maxFiles: 2,
    runStatus: async () => ({ exitCode: 0, stdout: statusBytes('## main', ...paths.map(path => ` M ${path}`)) }),
  });

  assert.equal(plan.changedFileCount, paths.length);
  assert.deepEqual(plan.coverage, { sampledFileCount: 2, totalChangedFileCount: paths.length, truncated: true, commandMatchScope: 'all', unclassifiedFilesScope: 'all' });
  assert.deepEqual(plan.unclassifiedFiles, ['scratch.txt']);
  assert.equal(plan.matchedRules.find(rule => rule.name === 'worktree-hygiene')?.matchedFileCount, paths.length);
  const commands = plan.commands.map(item => item.command);
  for (const expected of [
    'node scripts/ci/check-ai-validation-whitespace.mjs', 'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-ai-evolution-evals.mjs --json', 'node scripts/ci/run-ai-evolution-cases.mjs --all',
    'node scripts/ci/check-deploy-shell-syntax.mjs', 'node scripts/ci/check-frontend-static-retention.mjs',
    'env POSTGRES_PASSWORD=ci-postgres-password SPRING_DATASOURCE_PASSWORD=ci-postgres-password JWT_SECRET=ci-jwt-secret-for-compose-validation docker compose -f docker-compose.yml config',
    'docker compose -f docker-compose.local.yml config',
  ]) assert.ok(commands.includes(expected));
  assert.deepEqual(plan.manualChecks, [{
    id: 'compose-doc-semantics',
    reason: '人工核对 docs/CICD.md 与两个 Compose 文件、local-ci 和 CI workflow 的变量及命令语义一致',
  }]);
});

test('validation plan never reports sampled or collapsed status data as all-file coverage', () => {
  const snapshots = [
    { files: [{ status: 'M', path: 'AGENTS.md' }], allFiles: [{ status: 'M', path: 'AGENTS.md' }], changedFileCount: 2, truncated: true },
    { files: [{ status: '??', path: 'evals/' }], allFiles: [{ status: '??', path: 'evals/' }], changedFileCount: 1, truncated: false },
  ];
  for (const snapshot of snapshots) {
    const plan = buildJsonutilsValidationPlanFromWorktree({ ok: true, ...snapshot });
    assert.equal(plan.coverage.commandMatchScope, 'sample');
    assert.equal(plan.coverage.unclassifiedFilesScope, 'sample');
  }
});

test('production validation plan uses authoritative raw changed-set while keeping samples bounded', async () => {
  const plan = await buildJsonutilsValidationPlan({
    rootDir: '/fixture-root',
    maxFiles: 1,
    collectChangedSet: async rootDir => ({
      schemaVersion: 1,
      reportType: 'ai-governance-validation-changed-set',
      ok: rootDir === '/fixture-root',
      changedFileCount: 2,
      counts: { staged: 1, worktree: 1, untracked: 0, blocked: 0 },
      allFiles: [
        { path: 'AGENTS.md', changes: ['worktree-content'] },
        { path: 'scripts/ci/aiGovernanceValidationChangedSet.mjs', changes: ['staged-added'] },
      ],
      issues: [],
    }),
  });

  assert.deepEqual(plan.authority, {
    profile: 'raw-head-index-worktree-v1', authoritative: true, issueCount: 0,
  });
  assert.deepEqual(plan.coverage, {
    sampledFileCount: 1, totalChangedFileCount: 2, truncated: true,
    commandMatchScope: 'all', unclassifiedFilesScope: 'all',
  });
  assert.equal(plan.unclassifiedFileCount, 0);
});

test('authoritative changed-set failure emits no commands or path-bearing error', async () => {
  const plan = await buildJsonutilsValidationPlan({
    collectChangedSet: () => ({
      ok: false,
      changedFileCount: 0,
      counts: { staged: 0, worktree: 0, untracked: 0, blocked: 1 },
      allFiles: [],
      issues: [{ code: 'assume-unchanged', path: 'secret-name', source: 'index' }],
    }),
  });

  assert.equal(plan.ok, false);
  assert.deepEqual(plan.commands, []);
  assert.deepEqual(plan.manualChecks, []);
  assert.equal(plan.error, '权威变更集不可用');
  assert.equal(plan.error.includes('secret-name'), false);
  assert.deepEqual(plan.authority, {
    profile: 'raw-head-index-worktree-v1', authoritative: true, issueCount: 1,
  });
});

test('project plugin lifecycle CLI routes to AI governance and synthetic CI tests only', () => {
  const file = { status: 'M', path: 'scripts/ci/manage-project-plugins.mjs' };
  const plan = buildJsonutilsValidationPlanFromWorktree({ ok: true, files: [file], allFiles: [file], changedFileCount: 1, truncated: false });
  assert.deepEqual(plan.commands.map(item => item.command), [
    'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all',
    'node scripts/ci/write-ai-governance-artifacts.mjs --json',
    'node scripts/ci/write-ai-governance-artifacts.mjs --check --json',
    'node --test --test-reporter=dot scripts/ci/*.test.mjs',
    'node scripts/ci/check-ai-validation-whitespace.mjs',
  ]);
});

test('outcome writers route to governance and eval checks without write mode', () => {
  for (const writer of ['scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs']) {
    const file = { status: 'M', path: writer };
    const plan = buildJsonutilsValidationPlanFromWorktree({
      ok: true,
      files: [file],
      allFiles: [file],
      changedFileCount: 1,
      truncated: false,
    });
    const commands = plan.commands.map(item => item.command);
    assert.ok(commands.includes('node scripts/ci/check-ai-governance.mjs'));
    assert.ok(commands.includes('node scripts/ci/check-ai-evolution-evals.mjs --json'));
    assert.ok(commands.includes('node scripts/ci/run-ai-evolution-cases.mjs --all'));
    assert.equal(commands.some(command => command.includes(writer)), false);
    assert.equal(commands.some(command => command.includes('--write')), false);
    assert.deepEqual(plan.matchedRules.map(rule => rule.name), [
      'ai-governance-assets',
      'evolution-evals',
      'ci-governance-tests',
      'worktree-hygiene',
    ]);
  }
});

test('validation plan returns errors without inventing commands', async () => {
  const plan = await buildJsonutilsValidationPlan({
    runStatus: async () => ({ exitCode: 1, error: 'hermetic Git inventory 读取失败' }),
  });

  assert.equal(plan.ok, false);
  assert.deepEqual(plan.commands, []);
  assert.deepEqual(plan.manualChecks, []);
  assert.match(plan.error, /hermetic Git inventory/);
});
