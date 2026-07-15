import assert from 'node:assert/strict';
import { rm, symlink } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  preflightCodexFixedMcpTrial,
  verifyCodexFixedMcpTrialCapture,
} from './aiGovernanceCodexFixedMcpTrial.mjs';
import {
  buildCodexFixedMcpTrialProfile,
  CODEX_FIXED_MCP_TRIAL_RUNNER,
  withCodexFixedMcpIsolation,
} from './aiGovernanceCodexFixedMcpTrialProfile.mjs';
import {
  createFixedMcpShim as createShim,
  hashFile,
  REVISION,
  ROOT_DIR,
  runFixedMcpCases as runCases,
} from './aiGovernanceCodexFixedMcpTrialTestFixtures.mjs';
import { buildFixedMcpCapture } from './aiGovernanceCodexFixedMcpCaptureTestFixtures.mjs';

const buildCaptureJson = async ({ binaryPath, expectedBinarySha256, includeRequiredPath = true }) => (
  withCodexFixedMcpIsolation(async isolation => JSON.stringify(buildFixedMcpCapture(
    await buildCodexFixedMcpTrialProfile({
      rootDir: ROOT_DIR, binaryPath, expectedBinarySha256, isolation, modelId: 'gpt-5.4',
    }),
    { includeRequiredPath },
  )))
);

test('固定 profile 只是不可执行 component descriptor，不包含同 UID MCP 启动计划', async (t) => {
  const binaryPath = await createShim(t);
  const expectedBinarySha256 = await hashFile(binaryPath);
  await withCodexFixedMcpIsolation(async (isolation) => {
    const profile = await buildCodexFixedMcpTrialProfile({
      rootDir: ROOT_DIR, binaryPath, expectedBinarySha256, isolation, modelId: 'gpt-5.4',
    });
    const serialized = JSON.stringify(profile);
    assert.equal(profile.componentConstraints.executable, false);
    assert.equal(profile.componentConstraints.requiredMcp, 'jsonutils-governance/ai_governance_scorecard');
    assert.deepEqual(profile.componentConstraints.forbiddenCapabilities, [
      'shell', 'file-write', 'web', 'apps', 'multi-agent',
    ]);
    assert.match(profile.componentDescriptorSha256, /^[0-9a-f]{64}$/);
    assert.equal(serialized.includes('mcp_servers.'), false);
    assert.equal(serialized.includes('execArgs'), false);
    assert.equal(profile.binarySha256, expectedBinarySha256);
    assert.equal(profile.version, '1.3.1');
  });
});

test('固定 runner 用 allowlisted path 裁剪真实深层 scorecard，形成 policy-verified candidate', async (t) => {
  const binaryPath = await createShim(t);
  const expectedBinarySha256 = await hashFile(binaryPath);
  const result = await verifyCodexFixedMcpTrialCapture({
    rootDir: ROOT_DIR,
    binaryPath,
    expectedBinarySha256,
    modelId: 'gpt-5.4',
    captureJson: await buildCaptureJson({ binaryPath, expectedBinarySha256 }),
    resolveRevision: () => REVISION,
    runCases,
  });
  assert.equal(result.ok, true);
  assert.equal(result.evidenceScope, 'component-only');
  assert.equal(result.outcomeEligible, false);
  assert.equal(result.confirmedCoverageEligible, false);
  assert.equal(result.toolManifestCoverage, 'not-captured');
  assert.equal(result.automaticLedgerWrites, false);
  assert.equal(result.captureOrigin, 'external-json-unverified');
  assert.equal(result.ledgerBindings.length, 2);
  assert.equal(result.policyVerification.status, 'verified');
  assert.equal(result.trace.capture.status, 'complete');
  assert.equal(result.executionFacts.modelId, 'gpt-5.4');
  assert.match(result.executionFacts.adapterBundleSha256, /^[0-9a-f]{64}$/);
  assert.match(result.executionFacts.componentDescriptorSha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(result.trace.events.find(event => event.type === 'mcp.result').keys, [
    'maturityScorecard.nextFocus.id',
  ]);
  assert.deepEqual(result.trace.events.map(event => event.type), [
    'session.start', 'mcp.call', 'mcp.result', 'validation.start', 'validation.finish',
    'response.finish', 'session.finish',
  ]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes('NOT_RETAINED'), false);
  assert.equal(serialized.includes('COMPONENT_ONLY_TOKEN'), false);
});

test('缺少 policy 必需结果路径时 fail closed，symlink binary 也被 profile 拒绝', async (t) => {
  const incompleteBinaryPath = await createShim(t, { includeRequiredPath: false });
  const expectedBinarySha256 = await hashFile(incompleteBinaryPath);
  const result = await verifyCodexFixedMcpTrialCapture({
    rootDir: ROOT_DIR,
    binaryPath: incompleteBinaryPath,
    expectedBinarySha256,
    modelId: 'gpt-5.4',
    captureJson: await buildCaptureJson({
      binaryPath: incompleteBinaryPath, expectedBinarySha256, includeRequiredPath: false,
    }),
    resolveRevision: () => REVISION,
    runCases,
  });
  assert.equal(result.ok, false);
  assert.match(result.failures.join('\n'), /capture 不完整|结果缺少/);

  const target = await createShim(t);
  const targetSha256 = await hashFile(target);
  const linked = `${target}-link`;
  await symlink(target, linked);
  t.after(() => rm(linked, { force: true }));
  await assert.rejects(
    withCodexFixedMcpIsolation(isolation => buildCodexFixedMcpTrialProfile({
      rootDir: ROOT_DIR, binaryPath: linked, expectedBinarySha256: targetSha256, isolation, modelId: 'gpt-5.4',
    })),
    /不能是 symlink/,
  );
});

test('digest mismatch 与 worktree 内 binary 在任何版本探测前 fail closed', async (t) => {
  const binaryPath = await createShim(t);
  await assert.rejects(
    withCodexFixedMcpIsolation(isolation => buildCodexFixedMcpTrialProfile({
      rootDir: ROOT_DIR,
      binaryPath,
      expectedBinarySha256: '0'.repeat(64),
      isolation,
      modelId: 'gpt-5.4',
    })),
    /SHA-256 与 host 绑定不匹配/,
  );

  const worktreeBinary = fileURLToPath(import.meta.url);
  const worktreeBinarySha256 = await hashFile(worktreeBinary);
  await assert.rejects(
    withCodexFixedMcpIsolation(isolation => buildCodexFixedMcpTrialProfile({
      rootDir: ROOT_DIR,
      binaryPath: worktreeBinary,
      expectedBinarySha256: worktreeBinarySha256,
      isolation,
      modelId: 'gpt-5.4',
    })),
    /binaryPath 必须位于待测 worktree 之外/,
  );
});

test('keyless version preflight 不向 --version 注入 Codex 或 OpenAI key', async (t) => {
  const binaryPath = await createShim(t);
  const previousCodexKey = process.env.CODEX_API_KEY;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  process.env.CODEX_API_KEY = 'MUST_NOT_REACH_VERSION';
  process.env.OPENAI_API_KEY = 'MUST_NOT_REACH_VERSION';
  t.after(() => {
    if (previousCodexKey === undefined) delete process.env.CODEX_API_KEY;
    else process.env.CODEX_API_KEY = previousCodexKey;
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
  });
  const result = await preflightCodexFixedMcpTrial({
    rootDir: ROOT_DIR,
    binaryPath,
    expectedBinarySha256: await hashFile(binaryPath),
    modelId: 'gpt-5.4',
  });
  assert.equal(result.ok, true);
  assert.equal(result.runner, CODEX_FIXED_MCP_TRIAL_RUNNER);
  assert.equal(result.evidenceScope, 'component-only');
  assert.equal(result.toolManifestCoverage, 'not-captured');
});

test('固定 verifier 拒绝 callback，并锁定 validation 与 artifact verification 的 ledger 终点', async (t) => {
  const binaryPath = await createShim(t);
  const expectedBinarySha256 = await hashFile(binaryPath);
  const captureJson = await buildCaptureJson({ binaryPath, expectedBinarySha256 });
  const inputs = {
    rootDir: ROOT_DIR,
    binaryPath,
    expectedBinarySha256,
    modelId: 'gpt-5.4',
    resolveRevision: () => REVISION,
    runCases,
  };
  let callbackCalled = false;
  await assert.rejects(verifyCodexFixedMcpTrialCapture({
    ...inputs, capture: () => { callbackCalled = true; },
  }), /captureJson/);
  assert.equal(callbackCalled, false);
  let snapshots = 0;
  await assert.rejects(verifyCodexFixedMcpTrialCapture({
    ...inputs,
    captureJson,
    snapshotLedgers: async () => [{ sha256: snapshots++ === 0 ? 'before' : 'changed' }],
  }), /validation 改变了 receipt\/outcome ledger/);
  snapshots = 0;
  await assert.rejects(verifyCodexFixedMcpTrialCapture({
    ...inputs, captureJson, runCases: () => { throw new Error('validation failed after write'); },
    snapshotLedgers: async () => [{ sha256: snapshots++ === 0 ? 'before' : 'changed' }],
  }), /validation 改变了 receipt\/outcome ledger/);
  snapshots = 0;
  await assert.rejects(verifyCodexFixedMcpTrialCapture({
    ...inputs,
    captureJson,
    snapshotLedgers: async () => [{ sha256: snapshots++ < 2 ? 'stable' : 'changed' }],
  }), /candidate verification 改变了 receipt\/outcome ledger/);
});
