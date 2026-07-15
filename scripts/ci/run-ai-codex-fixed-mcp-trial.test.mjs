import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  CODEX_FIXED_MCP_TRIAL_ROOT,
  parseCodexFixedMcpTrialCliArgs,
  runCodexFixedMcpTrialCli,
} from './aiGovernanceCodexFixedMcpTrialCli.mjs';
import { createFixedMcpShim, hashFile } from './aiGovernanceCodexFixedMcpTrialTestFixtures.mjs';

const DIGEST = 'a'.repeat(64);
const KEY = 'COMPONENT_ONLY_SECRET_KEY';
const ENTRY = fileURLToPath(new URL('./run-ai-codex-fixed-mcp-trial.mjs', import.meta.url));
const baseArgs = (binary = '/external/codex', digest = DIGEST) => [
  'preflight', '--binary', binary, '--expected-binary-sha256', digest, '--model', 'gpt-5.4',
];
const componentReport = {
  schemaVersion: 1,
  reportType: 'codex-fixed-mcp-trial-preflight',
  ok: true,
  evidenceScope: 'component-only',
  outcomeEligible: false,
  confirmedCoverageEligible: false,
  toolManifestCoverage: 'not-captured',
  automaticLedgerWrites: false,
  runner: { id: 'codex-fixed-mcp-trial', version: '1.3.0', caseId: 'mcp-fixed-tool-selection' },
};

test('CLI 只接受固定 root 的无密钥 preflight', async () => {
  assert.deepEqual(parseCodexFixedMcpTrialCliArgs(baseArgs()), {
    command: 'preflight',
    binaryPath: '/external/codex',
    expectedBinarySha256: DIGEST,
    modelId: 'gpt-5.4',
  });
  let received;
  let output = '';
  await runCodexFixedMcpTrialCli({
    argv: baseArgs(),
    stdout: { write: chunk => { output += chunk; } },
    preflight: async (inputs) => { received = inputs; return componentReport; },
  });
  assert.equal(received.rootDir, CODEX_FIXED_MCP_TRIAL_ROOT);
  assert.match(output, /component-only/);
});

test('仓库 CLI fail closed 拒绝 run、任意 root 和重复参数', () => {
  for (const args of [
    ['run', ...baseArgs().slice(1)],
    [...baseArgs(), '--root', '/tmp/other'],
    [...baseArgs(), '--model', 'duplicate'],
  ]) assert.throws(() => parseCodexFixedMcpTrialCliArgs(args), /只允许|不支持|重复/);
});

test('直接入口在加载仓库模块前拒绝 Codex/OpenAI key', () => {
  for (const secretName of ['CODEX_API_KEY', 'OPENAI_API_KEY']) {
    const result = spawnSync(process.execPath, [ENTRY, ...baseArgs()], {
      cwd: CODEX_FIXED_MCP_TRIAL_ROOT,
      env: { ...process.env, [secretName]: KEY },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /拒绝携带模型凭据/);
    assert.equal(`${result.stdout}${result.stderr}`.includes(KEY), false);
  }
});

test('直接入口在无 key 环境完成真实 binary/version preflight', async (t) => {
  const binaryPath = await createFixedMcpShim(t);
  const env = { ...process.env };
  delete env.CODEX_API_KEY;
  delete env.OPENAI_API_KEY;
  const result = spawnSync(process.execPath, [ENTRY, ...baseArgs(binaryPath, await hashFile(binaryPath))], {
    cwd: path.resolve(CODEX_FIXED_MCP_TRIAL_ROOT), env, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.equal(report.runner.version, '1.3.0');
  assert.equal(report.evidenceScope, 'component-only');
  assert.equal(report.automaticLedgerWrites, false);
});
