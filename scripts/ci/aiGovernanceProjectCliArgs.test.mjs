import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scripts = [
  'scripts/ci/manage-project-plugins.mjs',
  'scripts/ci/check-project-plugin-installation.mjs',
  'scripts/ci/check-ai-asset-distribution.mjs',
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
];

const run = (script, args) => spawnSync(process.execPath, [script, ...args], {
  cwd: rootDir,
  encoding: 'utf8',
  env: { ...process.env, CODEX_HOME: path.join(rootDir, '.missing-codex-home-for-cli-test') },
});

test('项目 AI CLI 的 --help 不读取安装状态并以 0 退出', () => {
  for (const script of scripts) {
    const result = run(script, ['--help']);
    assert.equal(result.status, 0, `${script}: ${result.stderr}`);
    assert.match(result.stdout, /^Usage:/);
    assert.equal(result.stderr, '');
  }
});

test('项目 AI CLI 对未知或冲突参数以 2 fail closed', () => {
  for (const script of scripts) {
    const result = run(script, ['--unknown']);
    assert.equal(result.status, 2, `${script}: ${result.stdout}`);
    assert.match(result.stderr, /^Usage:[\s\S]+ARGUMENTS_INVALID/m);
  }

  const conflicting = run('scripts/ci/check-ai-asset-distribution.mjs', ['--workspace', '--head']);
  assert.equal(conflicting.status, 2);
  assert.match(conflicting.stderr, /ASSET_DISTRIBUTION_ARGUMENTS_INVALID/);

  const repeatedCase = run('scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', [
    '--case', 'mcp-readonly-shell-rejection',
    '--case', 'mcp-readonly-shell-rejection',
  ]);
  assert.equal(repeatedCase.status, 2);
  assert.match(repeatedCase.stderr, /DETERMINISTIC_OUTCOME_WRITER_ARGUMENTS_INVALID/);

  const repeatedTraceFlag = run('scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', ['--json', '--json']);
  assert.equal(repeatedTraceFlag.status, 2);
  assert.match(repeatedTraceFlag.stderr, /UNVERIFIED_TRACE_OUTCOME_WRITER_ARGUMENTS_INVALID/);
});
